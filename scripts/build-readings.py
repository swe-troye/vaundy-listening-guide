"""Map reference ruby readings onto supplied lyrics without replacing lyric text.

Requires local, untracked research/maru-<song-id>.html snapshots and the
UtaTen soramimi snapshot. Publishes text/reading segments only, never raw HTML.
"""
import difflib
import html
import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Editorial readings for supplied kanji where the reference writes kana, or
# uses a different spelling. These are ordinary readings, not verified sung overrides.
EDITOR_READINGS = {
    'hadaka-no-yusha': {'想': 'おも', '懐疑': 'かいぎ', '返': 'かえ'},
    'time-paradox': {'枯': 'か', '覗': 'のぞ'},
    'tokyo-flash': {'上手': 'うま', '悪': 'わる', '見': 'み', '越': 'こ', '何処': 'どこ', '止': 'や', '癖': 'くせ'},
    'todome': {'貴方': 'あなた', '私': 'わたし'},
    'yobigoe': {'暗闇': 'くらやみ', '照': 'て'},
    'hanauranai': {'事': 'こと', '何処': 'どこ', '何': 'なに', '達': 'たち', '千年': 'せんねん', '深': 'ふか', '土': 'つち', '様': 'よう', '貴方': 'あなた', '行': 'い', '雨': 'あめ', '立': 'た', '他愛': 'たわい'},
    'odoriko': {'被害者': 'ひがいしゃ', '面': 'づら'},
}

def plain(value):
    return html.unescape(re.sub(r'<[^>]*>', '', value))

def segments(fragment):
    result = []
    cursor = 0
    for match in re.finditer(r'<ruby\b[^>]*>(.*?)</ruby>', fragment, re.S):
        if match.start() > cursor:
            result.append({'text': plain(fragment[cursor:match.start()])})
        body = match.group(1)
        base = re.search(r'<rb\b[^>]*>(.*?)</rb>', body, re.S)
        reading = re.search(r'<(?:rt|rtc)\b[^>]*>(.*?)</(?:rt|rtc)>', body, re.S)
        if base and reading:
            result.append({'text': plain(base.group(1)), 'reading': plain(reading.group(1))})
        else:
            result.append({'text': plain(body)})
        cursor = match.end()
    if cursor < len(fragment):
        result.append({'text': plain(fragment[cursor:])})
    return [x for x in result if x['text']]

def normalize(text):
    out, positions = [], []
    for i, char in enumerate(text):
        for char in unicodedata.normalize('NFKC', char).lower():
            if not unicodedata.category(char).startswith(('P', 'Z', 'S')) and not char.isspace():
                out.append(char)
                positions.append(i)
    return ''.join(out), positions

def annotate(text, sources, vocabulary):
    target, positions = normalize(text)
    annotations = {}
    ranked = []
    for source in sources:
        full = ''.join(x['text'] for x in source)
        normal, src_positions = normalize(full)
        matcher = difflib.SequenceMatcher(None, normal, target, autojunk=False)
        blocks = matcher.get_matching_blocks()
        coverage = sum(b.size for b in blocks) / max(1, len(target))
        ranked.append((coverage, matcher.ratio(), source, normal, src_positions, blocks))
    if ranked:
        coverage, _, source, normal, src_positions, blocks = max(ranked, key=lambda x: (x[0], x[1]))
        if coverage >= .55:
            mapping = {b.a + i: b.b + i for b in blocks for i in range(b.size)}
            cursor = 0
            for token in source:
                end = cursor + len(token['text'])
                if token.get('reading'):
                    ids = [i for i, p in enumerate(src_positions) if cursor <= p < end]
                    mapped = [mapping.get(i) for i in ids]
                    if ids and all(i is not None for i in mapped) and mapped == list(range(mapped[0], mapped[0] + len(mapped))):
                        start, stop = positions[mapped[0]], positions[mapped[-1]] + 1
                        if normalize(text[start:stop])[0] == normalize(token['text'])[0]:
                            annotations[start] = (stop, token['reading'])
                cursor = end
    occupied = {i for start, (stop, _) in annotations.items() for i in range(start, stop)}
    # Only unambiguous per-song readings may fill unmatched words. Contextual
    # readings (一:いち/ひと, 愛:あい/いと, etc.) stay with their matched phrase.
    for base, readings in sorted(vocabulary.items(), key=lambda x: -len(x[0])):
        if len(readings) != 1:
            continue
        for match in re.finditer(re.escape(base), text):
            def kanji(c):
                return '\u3400' <= c <= '\u9fff'
            connected = (match.start() > 0 and kanji(text[match.start() - 1]) and match.start() - 1 not in occupied) or (match.end() < len(text) and kanji(text[match.end()]) and match.end() not in occupied)
            if not connected and not any(i in occupied for i in range(match.start(), match.end())):
                annotations[match.start()] = (match.end(), next(iter(readings)))
                occupied.update(range(match.start(), match.end()))
    out, cursor = [], 0
    for start, (stop, reading) in sorted(annotations.items()):
        if start < cursor:
            continue
        if start > cursor:
            out.append({'text': text[cursor:start]})
        out.append({'text': text[start:stop], 'reading': reading})
        cursor = stop
    if cursor < len(text):
        out.append({'text': text[cursor:]})
    return out or [{'text': text}]

script = "const vm=require('node:vm'),fs=require('node:fs'),c={window:{}};for(const f of ['data.js','youtube-lrc.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),c);console.log(JSON.stringify(c.window));"
data = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))
result, report = {}, []
for song in data['VAUNDY_SONGS']:
    sid = song['id']
    if sid == 'soramimi':
        page = (ROOT / 'research/nm20052727.html').read_text()
        fragment = re.search(r'<div class="hiragana"[^>]*>(.*?)</div>', page, re.S).group(1)
        fragment = re.sub(r'<span class="ruby"><span class="rb">(.*?)</span><span class="rt">(.*?)</span></span>', r'<ruby><rb>\1</rb><rt>\2</rt></ruby>', fragment, flags=re.S)
        fragments = re.split(r'<br\s*/?>', fragment)
        source_url = 'https://utaten.com/lyric/nm20052727/'
        source_name = 'UtaTen'
    else:
        page = (ROOT / f'research/maru-{sid}.html').read_text()
        fragments = re.findall(r'<p\b[^>]*class="lyrics-source\b[^\"]*"[^>]*>(.*?)</p>', page, re.S)
        source_url = next(x['url'] for x in song['sources'] if 'marumaru' in x['url'])
        source_name = 'marumaru'
    sources = [segments(f.strip()) for f in fragments if plain(f).strip()]
    assert sources, sid
    vocabulary = {}
    for line in sources:
        for token in line:
            if token.get('reading'):
                vocabulary.setdefault(token['text'], set()).add(token['reading'])
    supplementary = []
    original = next((x for x in song['sources'] if x['kind'] == 'original' and 'utaten' in x['url']), None)
    if original and sid != 'soramimi':
        path = ROOT / ('research/' + original['url'].rstrip('/').split('/')[-1] + '.html')
        if path.exists():
            extra_page = path.read_text()
            extra = re.search(r'<div class="hiragana"[^>]*>(.*?)</div>', extra_page, re.S)
            if extra:
                fragment = re.sub(r'<span class="ruby"><span class="rb">(.*?)</span><span class="rt">(.*?)</span></span>', r'<ruby><rb>\1</rb><rt>\2</rt></ruby>', extra.group(1), flags=re.S)
                supplementary = [segments(f.strip()) for f in re.split(r'<br\s*/?>', fragment) if plain(f).strip()]
    extra_vocabulary = {}
    for line in supplementary:
        for token in line:
            if token.get('reading'):
                extra_vocabulary.setdefault(token['text'], set()).add(token['reading'])
    # Equivalent numeric spellings in the supplied ZIP keep their original text.
    for base, aliases in [('二人', ['ニ人', '2人']), ('一口', ['1口'])]:
        readings = vocabulary.get(base, extra_vocabulary.get(base, set()))
        for alias in aliases:
            if len(readings) == 1:
                vocabulary[alias] = readings
    lines = {}
    used_extra = False
    lrc = data['VAUNDY_LRC'][sid]['text']
    timed = [re.sub(r'^\[[^]]*\]', '', x) for x in lrc.splitlines() if re.match(r'^\[\d', x)]
    for text in dict.fromkeys(timed[::2]):
        primary = annotate(text, sources, vocabulary)
        extra = annotate(text, supplementary, extra_vocabulary) if supplementary else []
        # Supplement only plain spans; never overwrite a contextual marumaru reading.
        extra_spans, pos = {}, 0
        for token in extra:
            if token.get('reading'):
                extra_spans[pos] = (pos + len(token['text']), token['reading'])
            pos += len(token['text'])
        merged, pos = [], 0
        for token in primary:
            end = pos + len(token['text'])
            if token.get('reading'):
                merged.append(token)
            else:
                cursor = pos
                for start, (stop, reading) in sorted(extra_spans.items()):
                    if pos <= start < stop <= end:
                        if start > cursor:
                            merged.append({'text': text[cursor:start]})
                        merged.append({'text': text[start:stop], 'reading': reading})
                        used_extra = True
                        cursor = stop
                if cursor < end:
                    merged.append({'text': text[cursor:end]})
            pos = end
        # Add explicit editorial readings without changing any lyric characters.
        spans, cursor = {}, 0
        for token in merged:
            if token.get('reading'):
                spans[cursor] = (cursor + len(token['text']), token['reading'])
            cursor += len(token['text'])
        for base, reading in sorted(EDITOR_READINGS.get(sid, {}).items(), key=lambda x: -len(x[0])):
            for match in re.finditer(re.escape(base), text):
                start, stop = match.span()
                overlaps = [a for a, (b, _) in spans.items() if a < stop and b > start]
                # Longer existing readings (e.g. 何年:なんねん) keep precedence.
                if any(a < start or spans[a][0] > stop for a in overlaps):
                    continue
                for a in overlaps:
                    del spans[a]
                spans[start] = (stop, reading)
        lines[text], cursor = [], 0
        for start, (stop, reading) in sorted(spans.items()):
            if start > cursor:
                lines[text].append({'text': text[cursor:start]})
            lines[text].append({'text': text[start:stop], 'reading': reading})
            cursor = stop
        if cursor < len(text):
            lines[text].append({'text': text[cursor:]})
        assert ''.join(x['text'] for x in lines[text]) == text, (sid, text)
    missing = [''.join(c for x in seg if not x.get('reading') for c in x['text'] if '\u3400' <= c <= '\u9fff') for seg in lines.values()]
    report.append({'song': sid, 'rubyCount': sum(bool(x.get('reading')) for seg in lines.values() for x in seg), 'unannotatedKanji': [x for x in missing if x]})
    result[sid] = {'sourceName': source_name, 'sourceUrl': source_url, 'supplementUrl': original['url'] if used_extra and original else None, 'editorialReadings': bool(EDITOR_READINGS.get(sid)), 'lines': lines}
(ROOT / 'youtube-readings.js').write_text('// Ruby readings reference marumaru (23 songs) / UtaTen (soramimi).\n// Base text remains the user-provided Japanese lyrics; reference HTML is not shipped.\nwindow.VAUNDY_READINGS = ' + json.dumps(result, ensure_ascii=False, indent=2) + ';\n')
(ROOT / 'research/readings-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
for x in report:
    print(x)
