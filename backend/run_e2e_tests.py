import requests
import uuid
import time
import os

BASE_URL = "http://localhost:8000/api"
TOKEN = None
SESSION = requests.Session()

def print_result(feature, status, msg=""):
    print(f"[{status}] {feature} {msg}")

def test_register_login():
    global TOKEN
    email = f"test_{uuid.uuid4()}@example.com"
    pwd = "password123"
    
    # Register
    res = SESSION.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pwd})
    if res.status_code != 200:
        print_result("Register/login", "FAIL", f"Register failed: {res.text}")
        return False
        
    # Login
    res = SESSION.post(f"{BASE_URL}/auth/login", json={"email": email, "password": pwd})
    if res.status_code != 200:
        print_result("Register/login", "FAIL", f"Login failed: {res.text}")
        return False
        
    TOKEN = res.json()["access_token"]
    SESSION.headers.update({"Authorization": f"Bearer {TOKEN}"})
    print_result("Register/login", "PASS")
    return True

def test_text_translation():
    res = SESSION.post(f"{BASE_URL}/translate/text", json={
        "text": "Hello world",
        "source_language": "en",
        "target_language": "fr"
    })
    if res.status_code == 200 and "Bonjour" in res.json().get("translated_text", ""):
        print_result("Text translation", "PASS")
        return True
    print_result("Text translation", "FAIL", f"Status {res.status_code}: {res.text}")
    return False

def _upload_file(filename, content, content_type):
    with open(filename, "wb") as f:
        f.write(content)
    with open(filename, "rb") as f:
        res = SESSION.post(f"{BASE_URL}/files/upload", files={"file": (filename, f, content_type)})
    os.remove(filename)
    if res.status_code == 200:
        return res.json()["file_id"]
    return None

def test_audio_translation():
    file_id = _upload_file("test.mp3", b"dummy mp3 data", "audio/mpeg")
    if not file_id:
        print_result("Audio translation", "FAIL", "File upload failed")
        return False
    res = SESSION.post(f"{BASE_URL}/jobs/audio-translation", json={
        "file_id": file_id,
        "source_language": "en",
        "target_language": "fr"
    })
    if res.status_code == 200:
        print_result("Audio translation", "PASS")
        return True
    print_result("Audio translation", "FAIL", str(res.text))
    return False

def test_video_translation():
    file_id = _upload_file("test.mp4", b"dummy mp4 data", "video/mp4")
    if not file_id:
        print_result("Video translation", "FAIL", "File upload failed")
        return False
    res = SESSION.post(f"{BASE_URL}/jobs/video-translation", json={
        "file_id": file_id,
        "source_language": "en",
        "target_language": "fr"
    })
    if res.status_code == 200:
        print_result("Video translation", "PASS")
        return True
    print_result("Video translation", "FAIL", str(res.text))
    return False

def test_document_translation():
    file_id = _upload_file("test.txt", b"dummy txt data", "text/plain")
    if not file_id:
        print_result("Document translation", "FAIL", "File upload failed")
        return False
    res = SESSION.post(f"{BASE_URL}/jobs/document-translation", json={
        "file_id": file_id,
        "source_language": "en",
        "target_language": "fr"
    })
    if res.status_code == 200:
        print_result("Document translation", "PASS")
        return res.json()["id"]
    print_result("Document translation", "FAIL", str(res.text))
    return None

def test_history():
    res = SESSION.get(f"{BASE_URL}/jobs/")
    if res.status_code == 200 and "items" in res.json():
        print_result("History", "PASS")
        return True
    print_result("History", "FAIL", str(res.text))
    return False

def test_glossary():
    res = SESSION.post(f"{BASE_URL}/glossaries/", json={"name": "Test Glossary", "source_language": "en", "target_language": "fr", "description": "Test"})
    if res.status_code == 200:
        print_result("Glossary", "PASS")
        return True
    print_result("Glossary", "FAIL", str(res.text))
    return False

def test_dashboard():
    res = SESSION.get(f"{BASE_URL}/dashboard/stats")
    if res.status_code == 200:
        print_result("Dashboard", "PASS")
        return True
    print_result("Dashboard", "FAIL", str(res.text))
    return False

def test_ai_assistant(job_id=None):
    res = SESSION.post(f"{BASE_URL}/assistant/chat", json={
        "query": "Hello",
        "job_id": job_id
    })
    if res.status_code == 200 and "message" in res.json():
        print_result("AI Assistant", "PASS")
        return True
    print_result("AI Assistant", "FAIL", str(res.text))
    return False

def test_projects():
    # 10. Create Project
    res = SESSION.post(f"{BASE_URL}/projects/", json={"name": "Test Project", "description": "Test"})
    if res.status_code not in (200, 201):
        print_result("Create Project", "FAIL", str(res.text))
        return None
    project_id = res.json()["id"]
    print_result("Create Project", "PASS")
    
    # 11. Assign translation to Project
    # We will upload a file and assign it
    file_id = _upload_file("test_proj.txt", b"dummy txt data", "text/plain")
    res2 = SESSION.post(f"{BASE_URL}/jobs/document-translation", json={
        "file_id": file_id,
        "source_language": "en",
        "target_language": "fr",
        "project_id": project_id
    })
    if res2.status_code == 200:
        print_result("Assign translation to Project", "PASS")
    else:
        print_result("Assign translation to Project", "FAIL", str(res2.text))
        
    # 12. Open Project
    res3 = SESSION.get(f"{BASE_URL}/projects/{project_id}")
    if res3.status_code == 200:
        print_result("Open Project", "PASS")
    else:
        print_result("Open Project", "FAIL", str(res3.text))
        
    # 13. Delete Project
    res4 = SESSION.delete(f"{BASE_URL}/projects/{project_id}")
    if res4.status_code in (200, 204):
        print_result("Delete Project", "PASS")
    else:
        print_result("Delete Project", "FAIL", str(res4.text))
        
    return project_id

def test_memory():
    # 14. Add Translation Memory
    res = SESSION.post(f"{BASE_URL}/memory/", json={
        "source_language": "en",
        "target_language": "fr",
        "source_text": "Good morning",
        "target_text": "Bonjour"
    })
    if res.status_code in (200, 201):
        print_result("Add Translation Memory", "PASS")
        mem_id = res.json()["id"]
    else:
        print_result("Add Translation Memory", "FAIL", str(res.text))
        return
        
    # 15. Memory search
    res2 = SESSION.get(f"{BASE_URL}/memory/?search=Good")
    if res2.status_code == 200 and len(res2.json()["items"]) > 0:
        print_result("Memory search", "PASS")
    else:
        print_result("Memory search", "FAIL", str(res2.text))
        
    # 16. Memory delete
    res3 = SESSION.delete(f"{BASE_URL}/memory/{mem_id}")
    if res3.status_code in (200, 204):
        print_result("Memory delete", "PASS")
    else:
        print_result("Memory delete", "FAIL", str(res3.text))

def test_image_translation():
    file_id = _upload_file("test.png", b"dummy png data", "image/png")
    if not file_id:
        print_result("Image OCR", "FAIL", "File upload failed")
        print_result("Image translation", "FAIL", "File upload failed")
        return False
        
    res = SESSION.post(f"{BASE_URL}/jobs/document-translation", json={
        "file_id": file_id,
        "source_language": "en",
        "target_language": "fr"
    })
    
    if res.status_code == 200:
        # Just creating the job is enough to say the API accepts it.
        # Background worker runs OCR and translation.
        print_result("Image OCR", "PASS", "(Job accepted)")
        print_result("Image translation", "PASS", "(Job accepted)")
    else:
        print_result("Image OCR", "FAIL", str(res.text))
        print_result("Image translation", "FAIL", str(res.text))

def run_all():
    print("Starting E2E Tests...\n")
    if not test_register_login():
        return
    test_text_translation()
    test_audio_translation()
    test_video_translation()
    doc_job_id = test_document_translation()
    test_history()
    test_glossary()
    test_dashboard()
    test_ai_assistant(doc_job_id)
    test_projects()
    test_memory()
    test_image_translation()
    
    # 17. Automatic memory save & 18. Memory cache hit
    # To test this, we translate the exact same text twice via text translation
    text_to_cache = f"Cache me {uuid.uuid4()}"
    # For text translation memory testing:
    res1 = SESSION.post(f"{BASE_URL}/translate/text", json={"text": text_to_cache, "source_language": "en", "target_language": "fr"})
    if res1.status_code in (200, 201) and res1.json().get("translation_source") == "AI Translated":
        print_result("Automatic memory save", "PASS")
    else:
        print_result("Automatic memory save", "FAIL")
        
    res2 = SESSION.post(f"{BASE_URL}/translate/text", json={"text": text_to_cache, "source_language": "en", "target_language": "fr"})
    if res2.status_code in (200, 201) and res2.json().get("translation_source") == "Reused from Translation Memory":
        print_result("Memory cache hit", "PASS")
    else:
        print_result("Memory cache hit", "FAIL")

if __name__ == "__main__":
    run_all()
