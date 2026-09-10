import asyncio

async def mock_translate(text):
    return text.upper()

class TranslationServiceMock:
    async def translate_text(self, text, *args, **kwargs):
        return await mock_translate(text), 'Mock'

class Seg:
    def __init__(self, s, e, t):
        self.start = s
        self.end = e
        self.text = t

stt_segments = [
    Seg(0, 2.5, 'hello world'),
    Seg(2.0, 4.0, 'overlapping segment'),  # Overlaps previous
    Seg(None, None, 'missing timestamps'), # Missing
    Seg(5.0, 4.0, 'invalid duration')      # end < start
]

async def main():
    translation_service = TranslationServiceMock()
    processed_segments = []
    last_end = 0.0
    
    for seg in stt_segments:
        start_val = seg.start if hasattr(seg, 'start') else seg.get('start')
        end_val = seg.end if hasattr(seg, 'end') else seg.get('end')
        text_val = seg.text if hasattr(seg, 'text') else seg.get('text', '')
        
        start_time = float(start_val) if start_val is not None else last_end
        end_time = float(end_val) if end_val is not None else (start_time + 2.0)
        
        start_time = max(0.0, start_time)
        end_time = max(start_time + 0.1, end_time)
        
        if start_time < last_end:
            start_time = last_end
            if end_time <= start_time:
                end_time = start_time + 0.1
                
        seg_translated, _ = await translation_service.translate_text(text_val)
        
        duration = end_time - start_time
        
        processed_segments.append({
            'start': start_time,
            'end': end_time,
            'duration': duration,
            'text': seg_translated
        })
        
        last_end = end_time

    for r in processed_segments:
        print(f"[{r['start']:.1f} -> {r['end']:.1f}] (dur: {r['duration']:.1f}s) {r['text']}")

asyncio.run(main())
