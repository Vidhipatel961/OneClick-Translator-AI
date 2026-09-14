import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, UploadCloud, FileText, Video, Mic, Image as ImageIcon, 
  File, Settings, ArrowRightLeft, Loader2, CheckCircle2, Download, 
  RotateCcw, AlertTriangle, Play, Sparkles, ChevronUp, ChevronDown, Book, Folder, Copy, Presentation
} from 'lucide-react';
import { apiUrl } from '../lib/api';
import { projectsApi, type Project } from '../api/projects';

type AppState = 'EMPTY' | 'FILE_SELECTED' | 'PROCESSING' | 'SUCCESS' | 'ERROR';



import pptxgen from "pptxgenjs";

export default function Translator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appState, setAppState] = useState<AppState>('EMPTY');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/languages')
      .then(res => res.json())
      .then(data => setLanguages([{code: 'auto', name: 'Auto-detect', direction: 'ltr'}, ...data]))
      .catch(err => console.error("Failed to load languages:", err));
  }, []);

  const sourceLangObj = languages.find(l => l.code === sourceLang);
  const targetLangObj = languages.find(l => l.code === targetLang);

  const downloadAsWord = (content: string, filename: string) => {
    const htmlStr = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${content.replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob([htmlStr], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printAsPdf = (content: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(`<html><head><meta charset="utf-8"><title>Translation</title></head><body style="white-space: pre-wrap; font-family: sans-serif; padding: 20px;">${content}</body></html>`);
    iframe.contentDocument?.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
  };

  const downloadAsPptx = (content: string, filename: string) => {
    const pres = new pptxgen();
    const slide = pres.addSlide();
    slide.addText(content, { x: 0.5, y: 0.5, w: '90%', h: '90%', fontSize: 14, color: '363636', align: 'left', valign: 'top' });
    pres.writeFile({ fileName: filename });
  };
  
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [mockResult, setMockResult] = useState('');
  const [glossaries, setGlossaries] = useState<any[]>([]);
  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchGlossaries();
    fetchProjects();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setTeams(await res.json());
    }
  };

  const fetchGlossaries = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/glossaries/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setGlossaries(await res.json());
    }
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await projectsApi.getProjects(token);
      setProjects(data);
    } catch(e) {}
  };
  const [fileContent, setFileContent] = useState('');
  const [selectedType, setSelectedType] = useState('text');
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'UPLOADING' | 'UPLOADED' | 'FAILED'>('IDLE');
  const [fileId, setFileId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sttResult, setSttResult] = useState<string>('');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('default');
  const [ttsSpeed, setTtsSpeed] = useState(1);
  const [translatedVideoUrl, setTranslatedVideoUrl] = useState<string | null>(null);
  const [subtitlesSrtUrl, setSubtitlesSrtUrl] = useState<string | null>(null);
  const [subtitlesVttUrl, setSubtitlesVttUrl] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [vttBlobUrl, setVttBlobUrl] = useState<string | null>(null);
  
  const [translatedPdfUrl, setTranslatedPdfUrl] = useState<string | null>(null);
  const [translatedDocumentUrl, setTranslatedDocumentUrl] = useState<string | null>(null);
  const [translatedImageUrl, setTranslatedImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatQuery, setChatQuery] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [translationSource, setTranslationSource] = useState<string | null>(null);

  // When ttsAudioUrl changes, fetch it with auth token and create a blob URL
  // so <audio src> and download links work without CORS/auth issues.
  useEffect(() => {
    if (!ttsAudioUrl) {
      setAudioBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');
    fetch(ttsAudioUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load audio: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        // If the blob type is wrong, override it, otherwise keep it
        const audioBlob = new Blob([blob], { type: 'audio/mpeg' });
        objectUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(objectUrl);
      })
      .catch(err => console.error('Audio load error:', err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ttsAudioUrl]);

  // Fetch video with auth token to create blob url
  useEffect(() => {
    if (!translatedVideoUrl) {
      setVideoBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');
    fetch(translatedVideoUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load video: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setVideoBlobUrl(objectUrl);
      })
      .catch(err => console.error('Video load error:', err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [translatedVideoUrl]);

  // Fetch vtt with auth token to create blob url
  useEffect(() => {
    if (!subtitlesVttUrl) {
      setVttBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');
    fetch(subtitlesVttUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load vtt: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setVttBlobUrl(objectUrl);
      })
      .catch(err => console.error('VTT load error:', err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [subtitlesVttUrl]);

  // Fetch image with auth token to create blob url
  useEffect(() => {
    if (!translatedImageUrl) {
      setImageBlobUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');
    fetch(translatedImageUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load image: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setImageBlobUrl(objectUrl);
      })
      .catch(err => console.error('Image load error:', err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [translatedImageUrl]);

  // Load existing job if present in URL
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId) {
      loadExistingJob(jobId);
    }
  }, []);

  const loadExistingJob = async (jobId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentJobId(data.id);
        setSourceLang(data.source_language || 'auto');
        setTargetLang(data.target_language || 'en');
        
        if (data.status === 'COMPLETED') {
          setAppState('SUCCESS');
          setWorkflowStage('COMPLETED');
          setProgress(100);
          
          if (data.original_transcript) setSttResult(data.original_transcript);
          if (data.result_text) setMockResult(data.result_text);
          if (data.result_audio_url) setTtsAudioUrl(apiUrl(data.result_audio_url));
          if (data.result_video_url) setTranslatedVideoUrl(apiUrl(data.result_video_url));
          if (data.result_pdf_url) setTranslatedPdfUrl(apiUrl(data.result_pdf_url));
          if (data.result_document_url) setTranslatedDocumentUrl(apiUrl(data.result_document_url));
          if (data.result_image_url) setTranslatedImageUrl(apiUrl(data.result_image_url));
          if (data.subtitles_srt_url) setSubtitlesSrtUrl(apiUrl(data.subtitles_srt_url));
          if (data.subtitles_vtt_url) setSubtitlesVttUrl(apiUrl(data.subtitles_vtt_url));
          if (data.translation_source) setTranslationSource(data.translation_source);
        } else if (data.status === 'FAILED') {
          setAppState('ERROR');
        } else {
          setAppState('PROCESSING');
          // It will need to poll, but we won't fully implement live resume here, just viewing state.
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const [workflowStage, setWorkflowStage] = useState<'IDLE'|'UPLOADING'|'EXTRACTING_AUDIO'|'EXTRACTING_TEXT'|'PERFORMING_OCR'|'TRANSCRIBING'|'TRANSLATING'|'TRANSLATING_DOCUMENT'|'GENERATING_VOICE'|'GENERATING_SUBTITLES'|'GENERATING_PDF'|'RENDERING_VIDEO'|'COMPLETED'>('IDLE');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    { id: 'text', name: 'Text', icon: <FileText className="w-5 h-5" />, active: true },
    { id: 'audio', name: 'Audio', icon: <Mic className="w-5 h-5" />, active: true },
    { id: 'video', name: 'Video', icon: <Video className="w-5 h-5" />, active: true },
    { id: 'pdf', name: 'PDF', icon: <File className="w-5 h-5" />, active: true },
    { id: 'docx', name: 'DOCX', icon: <File className="w-5 h-5" />, active: true },
    { id: 'pptx', name: 'PPTX', icon: <File className="w-5 h-5" />, active: true },
    { id: 'image', name: 'Image', icon: <ImageIcon className="w-5 h-5" />, active: true },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (selectedType === 'text' && (droppedFile.type.includes('text') || droppedFile.name.endsWith('.txt'))) {
         handleFileSelection(droppedFile);
      } else if (selectedType === 'audio' && (droppedFile.name.endsWith('.mp3') || droppedFile.name.endsWith('.wav') || droppedFile.name.endsWith('.m4a'))) {
         handleFileSelection(droppedFile);
      } else if (selectedType === 'video' && (droppedFile.name.endsWith('.mp4') || droppedFile.name.endsWith('.webm') || droppedFile.name.endsWith('.mov'))) {
         handleFileSelection(droppedFile);
      } else if (selectedType === 'pdf' && droppedFile.name.endsWith('.pdf')) {
         handleFileSelection(droppedFile);
      } else if (selectedType === 'docx' && (droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.doc'))) {
         handleFileSelection(droppedFile);
      } else if (selectedType === 'pptx' && (droppedFile.name.endsWith('.pptx') || droppedFile.name.endsWith('.ppt'))) {
         handleFileSelection(droppedFile);
      } else if (selectedType === 'image' && (droppedFile.name.endsWith('.png') || droppedFile.name.endsWith('.jpg') || droppedFile.name.endsWith('.jpeg') || droppedFile.name.endsWith('.webp'))) {
         handleFileSelection(droppedFile);
      } else {
         alert(`Please drop a valid file for the ${selectedType} tab.`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    setFile(selectedFile);
    setAppState('FILE_SELECTED');
    setProgress(0);
    setMockResult('');
    setTranslationSource(null);
    setUploadStatus('IDLE');
    setWorkflowStage('IDLE');
    setFileId(null);
    setSttResult('');
    setTtsAudioUrl(null);
    setAudioBlobUrl(null);
    setTranslatedVideoUrl(null);
    setVideoBlobUrl(null);
    setVttBlobUrl(null);
    setTranslatedPdfUrl(null);
    setTranslatedDocumentUrl(null);
    setPdfUrl(null);
    setImageUrl(null);
    setSubtitlesSrtUrl(null);
    setSubtitlesVttUrl(null);
    setIsGeneratingTTS(false);
    
    if (selectedType === 'text' && (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(selectedFile);
    } else if (['audio', 'video', 'pdf', 'docx', 'pptx', 'image'].includes(selectedType)) {
      setUploadStatus('UPLOADING');
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/files/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.detail || resData.message || 'Upload failed');
        }

        setFileId(resData.file_id);
        setUploadStatus('UPLOADED');
        const fileObjUrl = URL.createObjectURL(selectedFile);
        if (['audio', 'video'].includes(selectedType)) setAudioUrl(fileObjUrl);
        if (selectedType === 'pdf') setPdfUrl(fileObjUrl);
        if (selectedType === 'image') setImageUrl(fileObjUrl);
      } catch (err: unknown) {
        setUploadStatus('FAILED');
        setFileId(null);
        alert(err instanceof Error ? err.message : 'Upload failed');
      }
    }
  };

  const handleTranslate = async () => {
    if (selectedType === 'text' && !fileContent) return;
    if (['audio', 'video', 'pdf', 'docx', 'pptx', 'image'].includes(selectedType) && uploadStatus !== 'UPLOADED') return;
    setAppState('PROCESSING');
    setProgress(10);
    
    // Simulate progress for UI
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
      const token = localStorage.getItem('token');
      
      if (selectedType === 'text') {
        const res = await fetch('http://localhost:8000/api/translate/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: fileContent.substring(0, 5000),
            source_language: sourceLang,
            target_language: targetLang,
            glossary_id: selectedGlossaryId,
            project_id: selectedProjectId || undefined,
            team_id: selectedTeamId || undefined
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Translation failed');
        }

        const data = await res.json();
        clearInterval(interval);
        setProgress(100);
        setAppState('SUCCESS');
        setMockResult(data.translated_text);
        setTranslationSource(data.translation_source);
        
      } else if (['audio', 'video', 'pdf', 'docx', 'pptx', 'image'].includes(selectedType)) {
        if (!fileId) throw new Error('File not uploaded properly');
        
        // 1. Create Job
        setWorkflowStage('UPLOADING');
        setProgress(5);
        const endpoint = selectedType === 'audio' ? '/api/jobs/audio-translation' : selectedType === 'video' ? '/api/jobs/video-translation' : '/api/jobs/document-translation';
        const jobRes = await fetch(`http://localhost:8000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ file_id: fileId, source_language: sourceLang, target_language: targetLang, glossary_id: selectedGlossaryId, project_id: selectedProjectId || undefined, team_id: selectedTeamId || undefined })
        });
        if (!jobRes.ok) {
          const errData = await jobRes.json().catch(() => null);
          throw new Error(errData?.message || 'Failed to create background job');
        }
        const jobData = await jobRes.json();
        const jobId = jobData.id;
        setCurrentJobId(jobId);
        
        // 2. Poll Status
        const pollInterval = setInterval(async () => {
           try {
             const statusRes = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
             });
             if (!statusRes.ok) return;
             
             const statusData = await statusRes.json();
             setProgress(statusData.progress);
             
             if (statusData.status === 'EXTRACTING_AUDIO') setWorkflowStage('EXTRACTING_AUDIO');
             else if (statusData.status === 'EXTRACTING_TEXT') setWorkflowStage('EXTRACTING_TEXT');
             else if (statusData.status === 'PERFORMING_OCR') setWorkflowStage('PERFORMING_OCR');
             else if (statusData.status === 'TRANSCRIBING') setWorkflowStage('TRANSCRIBING');
             else if (statusData.status === 'TRANSLATING') setWorkflowStage('TRANSLATING');
             else if (statusData.status === 'TRANSLATING_DOCUMENT') setWorkflowStage('TRANSLATING_DOCUMENT');
             else if (statusData.status === 'GENERATING_AUDIO') setWorkflowStage('GENERATING_VOICE');
             else if (statusData.status === 'GENERATING_SUBTITLES') setWorkflowStage('GENERATING_SUBTITLES');
             else if (statusData.status === 'GENERATING_PDF') setWorkflowStage('GENERATING_PDF');
             else if (statusData.status === 'RENDERING_VIDEO') setWorkflowStage('RENDERING_VIDEO');
             
             if (statusData.status === 'COMPLETED') {
                clearInterval(pollInterval);
                setSttResult(statusData.original_transcript || '');
                setMockResult(statusData.result_text || '');
                if (statusData.result_audio_url) setTtsAudioUrl(apiUrl(statusData.result_audio_url));
                if (statusData.result_video_url) setTranslatedVideoUrl(apiUrl(statusData.result_video_url));
                if (statusData.result_pdf_url) setTranslatedPdfUrl(apiUrl(statusData.result_pdf_url));
                if (statusData.result_document_url) setTranslatedDocumentUrl(apiUrl(statusData.result_document_url));
                if (statusData.result_image_url) setTranslatedImageUrl(apiUrl(statusData.result_image_url));
                if (statusData.subtitles_srt_url) setSubtitlesSrtUrl(apiUrl(statusData.subtitles_srt_url));
                if (statusData.subtitles_vtt_url) setSubtitlesVttUrl(apiUrl(statusData.subtitles_vtt_url));
                if (statusData.translation_source) setTranslationSource(statusData.translation_source);
                
                setWorkflowStage('COMPLETED');
                setProgress(100);
                setAppState('SUCCESS');
             } else if (statusData.status === 'FAILED') {
                clearInterval(pollInterval);
                setAppState('ERROR');
                alert(statusData.error_message || "Job Failed");
             }
           } catch(e) { }
        }, 1500);
        
        // Save interval so we can clear it on unmount if needed, handled implicitly for now.
      }
    } catch (err: any) {
      clearInterval(interval);
      setAppState('ERROR');
      alert(err.message);
    }
  };

  const handleGenerateAudio = async () => {
    if (!mockResult) return;
    setIsGeneratingTTS(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/speech/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: mockResult,
          language: targetLang,
          voice: ttsVoice
        })
      });
      if (!res.ok) throw new Error('TTS failed');
      const data = await res.json();
      setTtsAudioUrl(apiUrl(data.audio_url));
    } catch (err) {
      alert("Failed to generate audio.");
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatQuery.trim()) return;
    const token = localStorage.getItem('token');
    
    const userMsg = { role: 'user', content: chatQuery };
    setChatMessages(prev => [...prev, userMsg]);
    setChatQuery('');
    setIsChatLoading(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          job_id: currentJobId,
          query: userMsg.content
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation_id);
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Network error.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  /** Download a backend file URL that requires auth. Uses blob to avoid CORS/auth issues. */
  const downloadAuthFile = async (url: string, filename: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      alert('Download failed. Please try again.');
    }
  };

  const handleReset = () => {
    setAppState('EMPTY');
    setFile(null);
    setProgress(0);
    setMockResult('');
    setTranslationSource(null);
    setFileContent('');
    setUploadStatus('IDLE');
    setWorkflowStage('IDLE');
    setFileId(null);
    setSttResult('');
    setTtsAudioUrl(null);
    setAudioBlobUrl(null);
    setTranslatedVideoUrl(null);
    setVideoBlobUrl(null);
    setVttBlobUrl(null);
    setTranslatedPdfUrl(null);
    setTranslatedDocumentUrl(null);
    setPdfUrl(null);
    setImageUrl(null);
    setSubtitlesSrtUrl(null);
    setSubtitlesVttUrl(null);
    setIsGeneratingTTS(false);
    setShowAiAssistant(false);
    setChatMessages([]);
    setConversationId(null);
    setCurrentJobId(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    searchParams.delete('jobId');
    setSearchParams(searchParams);
  };

  const handleSwap = () => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Lingora Workspace</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/glossaries" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center gap-1 transition px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
            <Book className="w-4 h-4" /> Glossaries
          </Link>
          <button className="text-slate-400 hover:text-white transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Language Selectors */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-xl shadow-black/20">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block px-1">Translate From</label>
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.filter(l => (['audio', 'video'].includes(selectedType) ? l.code !== 'auto' : true)).map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleSwap}
            className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full transition mt-5 sm:mt-5 text-slate-300"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block px-1">Translate To</label>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {languages.filter(l => l.code !== 'auto').map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full sm:w-1/4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block px-1 flex justify-between">
              <span>Project (Optional)</span>
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 w-full sm:w-1/4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block px-1 flex justify-between">
              <span>Workspace</span>
            </label>
            <div className="relative">
              <select 
                value={selectedTeamId || ''}
                onChange={(e) => setSelectedTeamId(e.target.value || null)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Personal Workspace</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Team)</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex-1 w-full sm:w-1/4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block px-1 flex justify-between">
              <span>Glossary (Optional)</span>
            </label>
            <div className="relative">
              <Book className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                value={selectedGlossaryId || ''}
                onChange={(e) => setSelectedGlossaryId(e.target.value || null)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None applied</option>
                {glossaries.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Workspace Area */}
        <div className="grid lg:grid-cols-2 gap-8 h-full">
          
          {/* Source Column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Source File
              <span className="text-xs px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700 font-normal">
                {sourceLangObj?.name}
              </span>
            </h3>

            {/* Input Types Indicator */}
            <div className="flex gap-2 flex-wrap mb-2">
              {supportedTypes.map((type) => (
                <div 
                  key={type.id} 
                  onClick={() => {
                     if (type.active) {
                        setSelectedType(type.id);
                        if (['audio', 'video'].includes(type.id) && sourceLang === 'auto') {
                           setSourceLang('en');
                        }
                     }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    type.active ? 'cursor-pointer' : 'cursor-not-allowed'
                  } ${
                    selectedType === type.id 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 ring-1 ring-blue-500/50' 
                      : type.active 
                        ? 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-900/50 text-slate-600 border-slate-800'
                  }`}
                  title={type.active ? '' : 'Coming Soon'}
                >
                  {React.cloneElement(type.icon, { className: 'w-3 h-3' })}
                  {type.name}
                </div>
              ))}
            </div>

            {/* Upload Area OR File Preview */}
            <div className="flex-1 min-h-[400px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative group transition-all">
              
              {appState === 'EMPTY' && (
                <div 
                  className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700/50 m-4 rounded-xl hover:bg-slate-800/50 hover:border-blue-500/50 transition cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Drag and drop file here</h4>
                  <p className="text-slate-400 text-center text-sm max-w-[250px] mb-6">
                    Supports {selectedType === 'text' ? '.txt' : selectedType === 'audio' ? '.mp3, .wav, .m4a' : selectedType === 'pdf' ? '.pdf' : selectedType === 'docx' ? '.docx, .doc' : selectedType === 'pptx' ? '.pptx, .ppt' : selectedType === 'image' ? '.png, .jpg, .webp' : '.mp4, .webm, .mov'} files.
                  </p>
                  <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-2 rounded-full font-medium transition text-sm">
                    Browse Files
                  </button>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept={selectedType === 'text' ? '.txt' : selectedType === 'audio' ? '.mp3,.wav,.m4a' : selectedType === 'pdf' ? '.pdf' : selectedType === 'docx' ? '.docx,.doc' : selectedType === 'pptx' ? '.pptx,.ppt' : selectedType === 'image' ? '.png,.jpg,.jpeg,.webp' : '.mp4,.webm,.mov'}
                  />
                </div>
              )}

              {(appState !== 'EMPTY' && file) && (
                <div className="flex-1 flex flex-col p-6">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg truncate max-w-[200px] sm:max-w-[300px]">{file.name}</h4>
                        <span className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    {appState === 'FILE_SELECTED' && (
                       <button onClick={handleReset} className="text-slate-400 hover:text-red-400 transition p-2 bg-slate-800 rounded-lg hover:bg-slate-800/80">
                         <RotateCcw className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                  
                  {['audio', 'video', 'pdf', 'docx', 'pptx', 'image'].includes(selectedType) ? (
                     <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-8 flex flex-col items-center justify-center relative">
                        {uploadStatus === 'UPLOADING' && <div className="text-blue-400 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2" /> Uploading file...</div>}
                        {uploadStatus === 'UPLOADED' && (
                          <div className="text-emerald-400 flex flex-col items-center w-full">
                            <CheckCircle2 className="w-8 h-8 mb-4" /> 
                            <p className="mb-4 font-medium">File Uploaded Successfully</p>
                            {audioUrl && selectedType === 'audio' && (
                              <audio controls src={audioUrl} className="w-full max-w-sm rounded-full" />
                            )}
                            {audioUrl && selectedType === 'video' && (
                              <video controls src={audioUrl} className="w-full max-w-sm rounded-xl aspect-video bg-black" />
                            )}
                            {pdfUrl && selectedType === 'pdf' && (
                              <div className="w-full max-w-sm aspect-[1/1.4] bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative flex items-center justify-center">
                                <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full absolute inset-0 opacity-50" />
                                <div className="z-10 bg-slate-900/80 px-4 py-2 rounded text-slate-200 backdrop-blur font-medium text-sm border border-slate-700">Preview Available</div>
                              </div>
                            )}
                            {imageUrl && selectedType === 'image' && (
                              <img src={imageUrl} alt="preview" className="w-full max-w-sm rounded-lg object-contain max-h-48 bg-black" />
                            )}
                          </div>
                        )}
                        {uploadStatus === 'FAILED' && <div className="text-red-400 flex flex-col items-center"><AlertTriangle className="w-8 h-8 mb-2" /> Upload Failed</div>}
                     </div>
                  ) : (
                    <div 
                      className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-sm text-slate-400 overflow-y-auto relative whitespace-pre-wrap"
                      dir={sourceLangObj?.direction || 'ltr'}
                    >
                      {fileContent || (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-600 select-none">
                          [ Empty File Content ]
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Target Column */}
          <div className="flex flex-col gap-4">
             <h3 className="font-semibold text-lg flex items-center gap-2">
              Translation Result
              <span className="text-xs px-2 py-1 bg-blue-900/30 rounded-md text-blue-400 border border-blue-800 font-normal">
                {targetLangObj?.name}
              </span>
            </h3>

            {/* Translate Action Area OR Result */}
            <div className={`flex-1 min-h-[400px] rounded-2xl flex flex-col overflow-hidden relative transition-all ${
              appState === 'SUCCESS' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900/30 border border-slate-800/50 border-dashed'
            }`}>
              
              {(appState === 'EMPTY' || appState === 'FILE_SELECTED') && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  {appState === 'EMPTY' ? (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 text-slate-600 mx-auto">
                        <File className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500">Select a file to translate</p>
                    </div>
                  ) : (
                    <div className="text-center w-full max-w-xs">
                      <button 
                        onClick={handleTranslate}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-purple-500/20 py-4 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition transform hover:scale-105 active:scale-95"
                      >
                        {selectedType === 'image' ? 'Translate Image' : 'Translate Now'} <Play className="w-5 h-5 fill-current" />
                      </button>
                      <p className="text-slate-500 text-sm mt-4">
                        Estimated time: ~5 seconds
                      </p>
                    </div>
                  )}
                </div>
              )}

              {appState === 'PROCESSING' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="relative w-24 h-24 mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" className="text-slate-800 stroke-current" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="50" cy="50" r="45" 
                        className="text-purple-500 stroke-current transition-all duration-300 ease-in-out" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        fill="transparent" 
                        strokeDasharray={283} 
                        strokeDashoffset={283 - (283 * progress) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{progress}%</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-medium mb-2 animate-pulse">
                    {workflowStage === 'EXTRACTING_AUDIO' && 'Extracting Audio...'}
                    {workflowStage === 'EXTRACTING_TEXT' && 'Extracting Document Text...'}
                    {workflowStage === 'PERFORMING_OCR' && 'Running OCR on Scanned Pages...'}
                    {workflowStage === 'TRANSCRIBING' && 'Transcribing...'}
                    {workflowStage === 'TRANSLATING' && 'Translating Text...'}
                    {workflowStage === 'TRANSLATING_DOCUMENT' && 'Translating Document Content...'}
                    {workflowStage === 'GENERATING_VOICE' && 'Generating Translated Voice...'}
                    {workflowStage === 'GENERATING_SUBTITLES' && 'Generating Subtitles...'}
                    {workflowStage === 'GENERATING_PDF' && 'Generating Formatted PDF...'}
                    {workflowStage === 'RENDERING_VIDEO' && 'Rendering Final Video...'}
                    {(workflowStage === 'IDLE' || workflowStage === 'UPLOADING') && 'Processing Translation...'}
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {workflowStage === 'EXTRACTING_AUDIO' && 'Isolating dialogue.'}
                    {workflowStage === 'EXTRACTING_TEXT' && 'Reading raw text content from document.'}
                    {workflowStage === 'PERFORMING_OCR' && 'Using Tesseract Vision AI to digitize text.'}
                    {workflowStage === 'TRANSCRIBING' && 'Applying neural models to extract speech.'}
                    {workflowStage === 'TRANSLATING' && 'Applying neural models to target language.'}
                    {workflowStage === 'TRANSLATING_DOCUMENT' && 'Preserving layout while converting languages.'}
                    {workflowStage === 'GENERATING_VOICE' && 'Synthesizing speech from translation.'}
                    {workflowStage === 'GENERATING_SUBTITLES' && 'Creating precise timestamped tracks.'}
                    {workflowStage === 'GENERATING_PDF' && 'Rendering formatted output document.'}
                    {workflowStage === 'RENDERING_VIDEO' && 'Muxing audio, video, and subtitles.'}
                    {(workflowStage === 'IDLE' || workflowStage === 'UPLOADING') && 'Please wait.'}
                  </p>
                  
                  {/* AI Assistant Toggle & Panel */}
                  <div className="bg-slate-900 border-t border-slate-800 p-4">
                     <button 
                       onClick={() => setShowAiAssistant(!showAiAssistant)}
                       className="w-full flex items-center justify-between text-indigo-400 hover:text-indigo-300 font-medium py-2 px-4 border border-indigo-500/30 rounded-lg bg-indigo-500/10 transition"
                     >
                       <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Chat with AI Assistant</span>
                       {showAiAssistant ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                     </button>
                     
                     {showAiAssistant && (
                       <div className="mt-4 flex flex-col h-80 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                         <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                           {chatMessages.length === 0 ? (
                             <div className="m-auto text-center text-slate-500 max-w-sm">
                               <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                               <p className="text-sm">I am Lingora AI. I can summarize, rewrite, explain, or extract data from this translation. What would you like to know?</p>
                             </div>
                           ) : (
                             chatMessages.map((msg, i) => (
                               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                   {msg.content}
                                 </div>
                               </div>
                             ))
                           )}
                           {isChatLoading && (
                             <div className="flex justify-start">
                               <div className="bg-slate-800 text-slate-200 rounded-lg p-3 text-sm flex items-center gap-2">
                                 <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                               </div>
                             </div>
                           )}
                         </div>
                         <div className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
                           <input 
                             type="text" 
                             value={chatQuery}
                             onChange={e => setChatQuery(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                             placeholder="Ask a question about this document..."
                             className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                           />
                           <button 
                             onClick={handleSendChat}
                             disabled={isChatLoading || !chatQuery.trim()}
                             className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg transition flex items-center justify-center"
                           >
                             <Sparkles className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              )}

              {appState === 'SUCCESS' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      Success
                    </div>
                    <div className="flex gap-2">
                       <button onClick={handleReset} className="text-slate-400 hover:text-white transition p-2 bg-slate-800 rounded-lg hover:bg-slate-700" title="Start Over">
                         <RotateCcw className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => {
                           if (ttsAudioUrl) downloadAuthFile(ttsAudioUrl, `translated_audio_${targetLang}.mp3`);
                           else if (translatedVideoUrl) downloadAuthFile(translatedVideoUrl, `translated_video_${targetLang}.mp4`);
                           else if (translatedPdfUrl) downloadAuthFile(translatedPdfUrl, `translated_${targetLang}.pdf`);
                           else if (translatedDocumentUrl) downloadAuthFile(translatedDocumentUrl, `translated_${targetLang}`);
                           else if (translatedImageUrl) downloadAuthFile(translatedImageUrl, `translated_${targetLang}.png`);
                           else {
                             const blob = new Blob([mockResult], { type: 'text/plain' });
                             const url = URL.createObjectURL(blob);
                             const a = document.createElement('a');
                             a.href = url; a.download = `translation_${targetLang}.txt`; a.click();
                           }
                         }}
                         className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20"
                       >
                         <Download className="w-4 h-4" /> Download
                       </button>
                    </div>
                  </div>
                  {['pdf', 'docx', 'pptx', 'image'].includes(selectedType) && (
                     <div className="p-4 bg-slate-900/80 border-b border-slate-800 hidden sm:block">
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="text-xs font-semibold text-slate-500 uppercase">{selectedType === 'image' ? 'Original Detected Text' : ['pdf', 'docx', 'pptx'].includes(selectedType) ? 'Original Document Content' : 'Original Transcript'} ({sourceLangObj?.name})</h4>
                         <div className="flex gap-3">
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(sttResult);
                             }}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Copy className="w-3 h-3" /> Copy
                           </button>
                           <button 
                             onClick={() => {
                               const blob = new Blob([sttResult], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `original_content_${sourceLangObj?.code}.txt`;
                               a.click();
                             }}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Download className="w-3 h-3" /> TXT
                           </button>
                           <button 
                             onClick={() => downloadAsWord(sttResult, `original_content_${sourceLangObj?.code}.doc`)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <FileText className="w-3 h-3" /> DOC
                           </button>
                           <button 
                             onClick={() => printAsPdf(sttResult)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <File className="w-3 h-3" /> PDF
                           </button>
                           <button 
                             onClick={() => downloadAsPptx(sttResult, `original_content_${sourceLangObj?.code}.pptx`)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Presentation className="w-3 h-3" /> PPTX
                           </button>
                         </div>
                       </div>
                       <div className={`font-mono text-sm text-slate-300 overflow-y-auto ${['pdf', 'docx', 'pptx', 'image'].includes(selectedType) ? 'max-h-64' : ''}`} dir={sourceLangObj?.direction || 'ltr'}>
                         {sttResult || (selectedType === 'image' ? <span className="text-slate-500 italic">No text detected in image</span> : null)}
                       </div>
                    </div>
                  )}
                  <div 
                    className={`flex-1 p-6 font-mono text-slate-300 whitespace-pre-wrap overflow-y-auto ${selectedType === 'video' ? 'hidden sm:block' : ''}`}
                    dir={targetLangObj?.direction || 'ltr'}
                  >
                    {['audio', 'video', 'pdf', 'docx', 'pptx', 'image'].includes(selectedType) ? (
                       <div className="flex items-center justify-between mb-4" dir="ltr">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase text-left">{selectedType === 'image' ? 'Translated Text' : ['pdf', 'docx', 'pptx'].includes(selectedType) ? 'Translated Document Content' : 'Translation'} ({targetLangObj?.name})</h4>
                          {translationSource && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${translationSource.includes('Memory') ? 'border-emerald-700/50 text-emerald-400 bg-emerald-900/30' : 'border-slate-700 text-slate-400 bg-slate-800'}`}>
                              {translationSource}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(mockResult);
                             }}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Copy className="w-3 h-3" /> Copy
                           </button>
                           <button 
                             onClick={() => {
                               const blob = new Blob([mockResult], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `translated_transcript_${targetLangObj?.code}.txt`;
                               a.click();
                             }}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Download className="w-3 h-3" /> TXT
                           </button>
                           <button 
                             onClick={() => downloadAsWord(mockResult, `translated_transcript_${targetLangObj?.code}.doc`)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <FileText className="w-3 h-3" /> DOC
                           </button>
                           <button 
                             onClick={() => printAsPdf(mockResult)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <File className="w-3 h-3" /> PDF
                           </button>
                           <button 
                             onClick={() => downloadAsPptx(mockResult, `translated_transcript_${targetLangObj?.code}.pptx`)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Presentation className="w-3 h-3" /> PPTX
                           </button>
                         </div>
                       </div>
                    ) : (
                      <div className="flex items-center justify-between mb-4" dir="ltr">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase text-left">Translation ({targetLangObj?.name})</h4>
                          {translationSource && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${translationSource.includes('Memory') ? 'border-emerald-700/50 text-emerald-400 bg-emerald-900/30' : 'border-slate-700 text-slate-400 bg-slate-800'}`}>
                              {translationSource}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 flex-wrap justify-end">
                           <button 
                             onClick={() => navigator.clipboard.writeText(mockResult)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Copy className="w-3 h-3" /> Copy
                           </button>
                           <button 
                             onClick={() => {
                               const blob = new Blob([mockResult], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `translated_text_${targetLangObj?.code}.txt`;
                               a.click();
                             }}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Download className="w-3 h-3" /> TXT
                           </button>
                           <button 
                             onClick={() => downloadAsWord(mockResult, `translated_text_${targetLangObj?.code}.doc`)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <FileText className="w-3 h-3" /> DOC
                           </button>
                           <button 
                             onClick={() => printAsPdf(mockResult)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <File className="w-3 h-3" /> PDF
                           </button>
                           <button 
                             onClick={() => downloadAsPptx(mockResult, `translated_text_${targetLangObj?.code}.pptx`)}
                             className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                             <Presentation className="w-3 h-3" /> PPTX
                           </button>
                         </div>
                      </div>
                    )}
                    {mockResult || (selectedType === 'image' ? <span className="text-slate-500 italic">No text detected in image</span> : null)}
                  </div>
                  
                  {mockResult && (
                    <div className="bg-slate-900 border-t border-slate-800 p-4">
                       {!ttsAudioUrl ? (
                         <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                           <div className="flex gap-2 w-full sm:w-auto">
                             <select 
                               value={ttsVoice} 
                               onChange={(e) => setTtsVoice(e.target.value)}
                               className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                             >
                               <option value="default">Default Voice</option>
                               <option value="male">Male Voice</option>
                               <option value="female">Female Voice</option>
                             </select>
                           </div>
                           <button 
                             onClick={handleGenerateAudio} 
                             disabled={isGeneratingTTS}
                             className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-lg font-medium w-full sm:w-auto justify-center disabled:opacity-50"
                           >
                             {isGeneratingTTS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                             {isGeneratingTTS ? 'Generating...' : 'Listen'}
                           </button>
                         </div>
                       ) : (
                         <div className="flex flex-col gap-3">
                           <div className="flex items-center justify-between text-sm text-slate-400">
                             <span>Generated Audio</span>
                             <select 
                               value={ttsSpeed} 
                               onChange={(e) => {
                                 setTtsSpeed(Number(e.target.value));
                                 const audioEl = document.getElementById('tts-audio') as HTMLAudioElement;
                                 if (audioEl) audioEl.playbackRate = Number(e.target.value);
                               }}
                               className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 focus:outline-none text-white"
                             >
                               <option value={0.75}>0.75x</option>
                               <option value={1}>1x Normal</option>
                               <option value={1.5}>1.5x</option>
                               <option value={2}>2x</option>
                             </select>
                           </div>
                           <audio id="tts-audio" controls src={audioBlobUrl || undefined} className="w-full h-10 rounded-full" autoPlay />
                           <div className="flex gap-2">
                             <button
                               onClick={() => {
                                 if (!audioBlobUrl) return;
                                 const a = document.createElement('a');
                                 a.href = audioBlobUrl;
                                 a.download = 'translated_audio.mp3';
                                 a.click();
                               }}
                               disabled={!audioBlobUrl}
                               className="flex-1 flex items-center justify-center gap-2 text-slate-300 bg-slate-800 hover:bg-slate-700 transition py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                             >
                               <Download className="w-4 h-4" /> Download Audio
                             </button>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                  
                  {selectedType === 'video' && translatedVideoUrl && (
                    <div className="bg-slate-900 border-t border-slate-800 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <span>Final Translated Video</span>
                      </div>
                      <video controls className="w-full aspect-video bg-black rounded-xl" crossOrigin="anonymous" src={videoBlobUrl || undefined}>
                        {vttBlobUrl && <track src={vttBlobUrl} kind="subtitles" srcLang={targetLang} label={targetLangObj?.name} default />}
                      </video>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => downloadAuthFile(translatedVideoUrl!, `translated_${file?.name || 'video.mp4'}`)}
                          className="flex-1 flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition py-2 rounded-lg font-medium text-sm shadow-lg shadow-blue-500/20"
                        >
                          <Download className="w-4 h-4" /> Download Video
                        </button>
                        {subtitlesSrtUrl && (
                          <button
                            onClick={() => downloadAuthFile(subtitlesSrtUrl!, `subtitles_${targetLang}.srt`)}
                            className="flex items-center justify-center gap-2 text-slate-300 bg-slate-800 hover:bg-slate-700 transition py-2 px-4 rounded-lg font-medium text-sm border border-slate-700"
                          >
                            SRT
                          </button>
                        )}
                        {subtitlesVttUrl && (
                          <button
                            onClick={() => downloadAuthFile(subtitlesVttUrl!, `subtitles_${targetLang}.vtt`)}
                            className="flex items-center justify-center gap-2 text-slate-300 bg-slate-800 hover:bg-slate-700 transition py-2 px-4 rounded-lg font-medium text-sm border border-slate-700"
                          >
                            VTT
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {['pdf', 'docx', 'pptx', 'image'].includes(selectedType) && (translatedPdfUrl || translatedDocumentUrl || translatedImageUrl) && (
                    <div className="bg-slate-900 border-t border-slate-800 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <span>Final Translated Document</span>
                      </div>
                      {translatedPdfUrl && (
                        <div className="w-full aspect-[1/1.4] bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative">
                          <iframe src={`${translatedPdfUrl}#toolbar=0`} className="w-full h-full absolute inset-0" />
                        </div>
                      )}
                      {selectedType === 'image' && translatedImageUrl && (
                        <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                          {imageUrl && (
                            <div className="flex-1 flex flex-col items-center gap-2">
                              <span className="text-xs text-slate-500 uppercase">Original</span>
                              <img src={imageUrl} className="max-h-64 object-contain rounded-lg border border-slate-800 bg-black/50" alt="Original" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-xs text-slate-500 uppercase">Translated</span>
                            {imageBlobUrl ? (
                              <img src={imageBlobUrl} className="max-h-64 object-contain rounded-lg border border-slate-800 bg-black/50" alt="Translated" />
                            ) : (
                              <div className="h-64 w-full flex items-center justify-center text-slate-500">
                                <Loader2 className="w-6 h-6 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            const url = translatedPdfUrl || translatedDocumentUrl || translatedImageUrl;
                            if (url) downloadAuthFile(url, `translated_${file?.name || 'document'}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition py-2 rounded-lg font-medium text-sm shadow-lg shadow-blue-500/20"
                        >
                          <Download className="w-4 h-4" /> Download Translated File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
