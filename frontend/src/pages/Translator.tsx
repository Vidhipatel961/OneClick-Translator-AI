import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plyr } from 'plyr-react';
import 'plyr/dist/plyr.css';
import { 
  ArrowLeft, UploadCloud, FileText, Video, Mic, Image as ImageIcon, 
  File, Settings, ArrowRightLeft, Loader2, CheckCircle2, Download, 
  RotateCcw, AlertTriangle, Play, Sparkles, ChevronUp, ChevronDown, Book, Folder, Copy, Presentation,
  Columns2, Eye
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
  const [resultTab, setResultTab] = useState<'visual' | 'text' | 'compare'>('visual');
  
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
          
          setSttResult(data.original_transcript || '');
          setMockResult(data.result_text || '');
          setTtsAudioUrl(data.result_audio_url ? apiUrl(data.result_audio_url) : null);
          setTranslatedVideoUrl(data.result_video_url ? apiUrl(data.result_video_url) : null);
          setTranslatedPdfUrl(data.result_pdf_url ? apiUrl(data.result_pdf_url) : null);
          setTranslatedDocumentUrl(data.result_document_url ? apiUrl(data.result_document_url) : null);
          setTranslatedImageUrl(data.result_image_url ? apiUrl(data.result_image_url) : null);
          setSubtitlesSrtUrl(data.subtitles_srt_url ? apiUrl(data.subtitles_srt_url) : null);
          setSubtitlesVttUrl(data.subtitles_vtt_url ? apiUrl(data.subtitles_vtt_url) : null);
          setTranslationSource(data.translation_source || null);
          setResultTab(data.result_image_url || data.result_pdf_url ? 'visual' : 'text');
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
    setTranslatedImageUrl(null);
    setImageBlobUrl(null);
    setResultTab('visual');
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
                 setTtsAudioUrl(statusData.result_audio_url ? apiUrl(statusData.result_audio_url) : null);
                 setTranslatedVideoUrl(statusData.result_video_url ? apiUrl(statusData.result_video_url) : null);
                 setTranslatedPdfUrl(statusData.result_pdf_url ? apiUrl(statusData.result_pdf_url) : null);
                 setTranslatedDocumentUrl(statusData.result_document_url ? apiUrl(statusData.result_document_url) : null);
                 setTranslatedImageUrl(statusData.result_image_url ? apiUrl(statusData.result_image_url) : null);
                 setSubtitlesSrtUrl(statusData.subtitles_srt_url ? apiUrl(statusData.subtitles_srt_url) : null);
                 setSubtitlesVttUrl(statusData.subtitles_vtt_url ? apiUrl(statusData.subtitles_vtt_url) : null);
                 setTranslationSource(statusData.translation_source || null);
                 setResultTab(statusData.result_image_url || statusData.result_pdf_url ? 'visual' : 'text');
                 
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
    setTranslatedImageUrl(null);
    setImageBlobUrl(null);
    setResultTab('visual');
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
    <div className="h-full bg-background text-text-main font-sans flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        
        {/* Language Selectors */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-xl shadow-black/20">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block px-1">Translate From</label>
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-primary/5 border border-primary/20 text-text-main rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {languages.filter(l => (['audio', 'video'].includes(selectedType) ? l.code !== 'auto' : true)).map(lang => (
                <option className="bg-surface text-text-main" key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleSwap}
            className="p-3 bg-surface-hover hover:bg-surface-hover border border-border rounded-full transition mt-5 sm:mt-5 text-text-main"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block px-1">Translate To</label>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-primary/5 border border-primary/20 text-text-main rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {languages.filter(l => l.code !== 'auto').map(lang => (
                <option className="bg-surface text-text-main" key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full sm:w-1/4">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block px-1 flex justify-between">
              <span>Project (Optional)</span>
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
              <select 
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className="w-full bg-primary/5 border border-primary/20 text-text-main rounded-xl pl-9 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option className="bg-surface text-text-main" value="">No Project</option>
                {projects.map(p => (
                  <option className="bg-surface text-text-main" key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 w-full sm:w-1/4">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block px-1 flex justify-between">
              <span>Workspace</span>
            </label>
            <div className="relative">
              <select 
                value={selectedTeamId || ''}
                onChange={(e) => setSelectedTeamId(e.target.value || null)}
                className="w-full bg-primary/5 border border-primary/20 text-text-main rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option className="bg-surface text-text-main" value="">Personal Workspace</option>
                {teams.map(t => (
                  <option className="bg-surface text-text-main" key={t.id} value={t.id}>{t.name} (Team)</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex-1 w-full sm:w-1/4">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block px-1 flex justify-between">
              <span>Glossary (Optional)</span>
            </label>
            <div className="relative">
              <Book className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
              <select 
                value={selectedGlossaryId || ''}
                onChange={(e) => setSelectedGlossaryId(e.target.value || null)}
                className="w-full bg-primary/5 border border-primary/20 text-text-main rounded-xl pl-9 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option className="bg-surface text-text-main" value="">None applied</option>
                {glossaries.map(g => (
                  <option className="bg-surface text-text-main" key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Workspace Area */}
        <div className="grid lg:grid-cols-2 gap-8 flex-1 min-h-0">
          
          {/* Source Column */}
          <div className="flex flex-col gap-4 min-h-0">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Source File
              <span className="text-xs px-2 py-1 bg-surface-hover rounded-md text-text-muted border border-border font-normal">
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
                      ? 'bg-primary/20 text-primary border-primary/30 ring-1 ring-primary/50' 
                      : type.active 
                        ? 'bg-surface-hover text-text-main border-border hover:bg-surface-hover'
                        : 'bg-surface text-text-disabled border-border'
                  }`}
                  title={type.active ? '' : 'Coming Soon'}
                >
                  {React.cloneElement(type.icon, { className: 'w-3 h-3' })}
                  {type.name}
                </div>
              ))}
            </div>

            {/* Upload Area OR File Preview */}
            <div className="flex-1 min-h-[420px] lg:min-h-[540px] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden relative group transition-all">
              
              {appState === 'EMPTY' && (
                <div 
                  className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/40 bg-primary/5 m-4 rounded-xl hover:bg-primary/10 hover:border-primary transition cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Drag and drop file here</h4>
                  <p className="text-text-muted text-center text-sm max-w-[250px] mb-6">
                    Supports {selectedType === 'text' ? '.txt' : selectedType === 'audio' ? '.mp3, .wav, .m4a' : selectedType === 'pdf' ? '.pdf' : selectedType === 'docx' ? '.docx, .doc' : selectedType === 'pptx' ? '.pptx, .ppt' : selectedType === 'image' ? '.png, .jpg, .webp' : '.mp4, .webm, .mov'} files.
                  </p>
                  <button className="bg-surface-hover hover:bg-surface-hover border border-border px-6 py-2 rounded-full font-medium transition text-sm">
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
                <div className="flex-1 flex flex-col p-6 min-h-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg truncate max-w-[200px] sm:max-w-[300px]">{file.name}</h4>
                        <span className="text-sm text-text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    {appState === 'FILE_SELECTED' && (
                       <button onClick={handleReset} className="text-text-muted hover:text-red-400 transition p-2 bg-surface-hover rounded-lg hover:bg-surface-hover">
                         <RotateCcw className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                  
                  {['audio', 'video', 'pdf', 'docx', 'pptx', 'image'].includes(selectedType) ? (
                     <div className="flex-1 bg-background rounded-xl border border-border p-8 flex flex-col items-center justify-center relative">
                        {uploadStatus === 'UPLOADING' && <div className="text-primary flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2" /> Uploading file...</div>}
                        {uploadStatus === 'UPLOADED' && (
                          <div className="text-primary flex flex-col items-center w-full">
                            <CheckCircle2 className="w-8 h-8 mb-4" /> 
                            <p className="mb-4 font-medium">File Uploaded Successfully</p>
                            {audioUrl && selectedType === 'audio' && (
                              <audio controls src={audioUrl} className="w-full max-w-sm rounded-full" />
                            )}
                            {audioUrl && selectedType === 'video' && (
                              <video controls src={audioUrl} className="w-full max-w-sm rounded-xl aspect-video bg-black" />
                            )}
                            {pdfUrl && selectedType === 'pdf' && (
                              <div className="w-full max-w-sm aspect-[1/1.4] bg-surface-hover rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
                                <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full absolute inset-0 opacity-50" />
                                <div className="z-10 bg-surface px-4 py-2 rounded text-text-main backdrop-blur font-medium text-sm border border-border">Preview Available</div>
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
                      className="flex-1 bg-background rounded-xl border border-border p-4 font-mono text-sm text-text-muted overflow-y-auto show-scrollbar relative whitespace-pre-wrap"
                      dir={sourceLangObj?.direction || 'ltr'}
                    >
                      {fileContent || (
                        <div className="absolute inset-0 flex items-center justify-center text-text-disabled select-none">
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
          <div className="flex flex-col gap-4 min-h-0">
             <h3 className="font-semibold text-lg flex items-center gap-2">
              Translation Result
              <span className="text-xs px-2 py-1 bg-primary/20 rounded-md text-primary border border-primary/40 font-normal">
                {targetLangObj?.name}
              </span>
            </h3>

            {/* Translate Action Area OR Result */}
            <div className={`flex-1 min-h-[420px] lg:min-h-[540px] rounded-2xl flex flex-col overflow-hidden relative transition-all ${
              appState === 'SUCCESS' ? 'bg-surface border border-border' : 'bg-surface border border-border border-dashed'
            }`}>
              
              {(appState === 'EMPTY' || appState === 'FILE_SELECTED') && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  {appState === 'EMPTY' ? (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-6 text-text-disabled mx-auto">
                        <File className="w-8 h-8" />
                      </div>
                      <p className="text-text-disabled">Select a file to translate</p>
                    </div>
                  ) : (
                    <div className="text-center w-full max-w-xs">
                      <button 
                        onClick={handleTranslate}
                        className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary text-[#04110F] shadow-xl shadow-primary/20 py-4 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition transform hover:scale-105 active:scale-95"
                      >
                        {selectedType === 'image' ? 'Translate Image' : 'Translate Now'} <Play className="w-5 h-5 fill-current" />
                      </button>
                      <p className="text-text-disabled text-sm mt-4">
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
                        className="text-primary stroke-current transition-all duration-300 ease-in-out" 
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
                  <p className="text-text-muted text-sm">
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
                  <div className="bg-surface border-t border-border p-4">
                     <button 
                       onClick={() => setShowAiAssistant(!showAiAssistant)}
                       className="w-full flex items-center justify-between text-primary hover:text-primary font-medium py-2 px-4 border border-primary/30 rounded-lg bg-primary/10 transition"
                     >
                       <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Chat with AI Assistant</span>
                       {showAiAssistant ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                     </button>
                     
                     {showAiAssistant && (
                       <div className="mt-4 flex flex-col h-80 bg-background rounded-lg border border-border overflow-hidden">
                         <div className="flex-1 overflow-y-auto show-scrollbar p-4 flex flex-col gap-4">
                           {chatMessages.length === 0 ? (
                             <div className="m-auto text-center text-text-disabled max-w-sm">
                               <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                               <p className="text-sm">I am OneClick AI. I can summarize, rewrite, explain, or extract data from this translation. What would you like to know?</p>
                             </div>
                           ) : (
                             chatMessages.map((msg, i) => (
                               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-[#04110F]' : 'bg-surface-hover text-text-main'}`}>
                                   {msg.content}
                                 </div>
                               </div>
                             ))
                           )}
                           {isChatLoading && (
                             <div className="flex justify-start">
                               <div className="bg-surface-hover text-text-main rounded-lg p-3 text-sm flex items-center gap-2">
                                 <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                               </div>
                             </div>
                           )}
                         </div>
                         <div className="p-3 border-t border-border bg-surface flex gap-2">
                           <input 
                             type="text" 
                             value={chatQuery}
                             onChange={e => setChatQuery(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                             placeholder="Ask a question about this document..."
                             className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
                           />
                           <button 
                             onClick={handleSendChat}
                             disabled={isChatLoading || !chatQuery.trim()}
                             className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-[#04110F] p-2 rounded-lg transition flex items-center justify-center"
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
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Result Header: Success Status, Segmented Tabs, and Action Controls */}
                  <div className="p-3 sm:p-4 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-primary font-medium text-sm sm:text-base">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Success</span>
                    </div>

                    {/* Segmented View Tabs for Image & Document Types */}
                    {selectedType === 'image' && (
                      <div className="flex items-center bg-background/80 p-1 rounded-xl border border-border text-xs">
                        <button
                          onClick={() => setResultTab('visual')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                            resultTab === 'visual'
                              ? 'bg-primary text-[#04110F] shadow-sm font-semibold'
                              : 'text-text-muted hover:text-text-main'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Translated Image</span>
                        </button>
                        <button
                          onClick={() => setResultTab('text')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                            resultTab === 'text'
                              ? 'bg-primary text-[#04110F] shadow-sm font-semibold'
                              : 'text-text-muted hover:text-text-main'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Text Result</span>
                        </button>
                        {imageUrl && (
                          <button
                            onClick={() => setResultTab('compare')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                              resultTab === 'compare'
                                ? 'bg-primary text-[#04110F] shadow-sm font-semibold'
                                : 'text-text-muted hover:text-text-main'
                            }`}
                          >
                            <Columns2 className="w-3.5 h-3.5" />
                            <span>Side-by-Side</span>
                          </button>
                        )}
                      </div>
                    )}

                    {['pdf', 'docx', 'pptx'].includes(selectedType) && (
                      <div className="flex items-center bg-background/80 p-1 rounded-xl border border-border text-xs">
                        <button
                          onClick={() => setResultTab('visual')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                            resultTab === 'visual'
                              ? 'bg-primary text-[#04110F] shadow-sm font-semibold'
                              : 'text-text-muted hover:text-text-main'
                          }`}
                        >
                          <File className="w-3.5 h-3.5" />
                          <span>Document</span>
                        </button>
                        <button
                          onClick={() => setResultTab('text')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                            resultTab === 'text'
                              ? 'bg-primary text-[#04110F] shadow-sm font-semibold'
                              : 'text-text-muted hover:text-text-main'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Text</span>
                        </button>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                       <button onClick={handleReset} className="text-text-muted hover:text-text-main transition p-2 bg-surface-hover rounded-lg" title="Start Over">
                         <RotateCcw className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => {
                           if (selectedType === 'image' && translatedImageUrl) downloadAuthFile(translatedImageUrl, `translated_${file?.name || 'image.png'}`);
                           else if (ttsAudioUrl && selectedType === 'audio') downloadAuthFile(ttsAudioUrl, `translated_audio_${targetLang}.mp3`);
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
                         className="flex items-center gap-2 text-[#04110F] bg-primary hover:bg-primary-dark transition px-3 sm:px-4 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 text-xs sm:text-sm"
                       >
                         <Download className="w-4 h-4" /> Download
                       </button>
                    </div>
                  </div>

                  {/* Scrollable Result Body */}
                  <div className="flex-1 overflow-y-auto show-scrollbar p-4 sm:p-5 space-y-4">

                    {/* ── IMAGE TRANSLATION VIEWS ── */}
                    {selectedType === 'image' && (
                      <>
                        {/* Tab 1: Translated Image Preview */}
                        {resultTab === 'visual' && (
                          <div className="space-y-4">
                            <div className="relative w-full min-h-[260px] max-h-[420px] flex items-center justify-center bg-black/40 rounded-xl border border-border p-3 overflow-hidden">
                              {imageBlobUrl ? (
                                <img 
                                  src={imageBlobUrl} 
                                  alt="Translated Result" 
                                  className="max-h-[380px] w-auto max-w-full object-contain rounded shadow-lg" 
                                />
                              ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-text-disabled gap-2">
                                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                  <span className="text-xs">Loading translated image...</span>
                                </div>
                              )}
                            </div>

                            {/* Action Bar below Image */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-background/50 rounded-xl border border-border text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                {translationSource && (
                                  <span className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${translationSource.includes('Memory') ? 'border-primary-dark/50 text-primary bg-primary/20' : 'border-border text-text-muted bg-surface-hover'}`}>
                                    {translationSource}
                                  </span>
                                )}
                                <span className="text-text-muted">Target: <strong className="text-text-main">{targetLangObj?.name || targetLang}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                {imageBlobUrl && (
                                  <a 
                                    href={imageBlobUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface-hover text-text-main transition"
                                    title="Open full size image in new tab"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Full Size
                                  </a>
                                )}
                                {translatedImageUrl && (
                                  <button
                                    onClick={() => downloadAuthFile(translatedImageUrl, `translated_${file?.name || 'image.png'}`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-[#04110F] font-medium transition shadow-sm"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download Image
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Translated Text Preview Card under Image */}
                            {mockResult && (
                              <div className="bg-background/60 rounded-xl border border-border p-4 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-text-disabled uppercase">Extracted & Translated Text</span>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(mockResult)}
                                    className="text-xs text-primary hover:text-primary flex items-center gap-1 font-medium"
                                  >
                                    <Copy className="w-3 h-3" /> Copy Text
                                  </button>
                                </div>
                                <div className="font-mono text-xs sm:text-sm text-text-main whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto show-scrollbar select-text bg-surface/50 p-3 rounded-lg border border-border/50" dir={targetLangObj?.direction || 'ltr'}>
                                  {mockResult}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab 2: Side-by-Side Comparison */}
                        {resultTab === 'compare' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <div className="flex flex-col items-center gap-2 bg-background/60 p-3 rounded-xl border border-border">
                              <span className="text-xs font-semibold text-text-disabled uppercase">Original ({sourceLangObj?.name || 'Source'})</span>
                              {imageUrl ? (
                                <img src={imageUrl} alt="Original" className="max-h-[340px] w-auto max-w-full object-contain rounded bg-black/40 border border-border/40" />
                              ) : (
                                <div className="h-48 flex items-center justify-center text-text-disabled text-xs">No preview available</div>
                              )}
                            </div>
                            <div className="flex flex-col items-center gap-2 bg-background/60 p-3 rounded-xl border border-border">
                              <span className="text-xs font-semibold text-primary uppercase">Translated ({targetLangObj?.name || 'Target'})</span>
                              {imageBlobUrl ? (
                                <img src={imageBlobUrl} alt="Translated" className="max-h-[340px] w-auto max-w-full object-contain rounded bg-black/40 border border-border/40" />
                              ) : (
                                <div className="h-48 flex items-center justify-center text-text-disabled text-xs"><Loader2 className="w-5 h-5 animate-spin" /></div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── DOCUMENT PREVIEWS (PDF / DOCX / PPTX) ── */}
                    {['pdf', 'docx', 'pptx'].includes(selectedType) && resultTab === 'visual' && (
                      <div className="space-y-4">
                        {translatedPdfUrl && (
                          <div className="w-full aspect-[1/1.3] max-h-[500px] bg-surface-hover rounded-xl overflow-hidden border border-border relative">
                            <iframe src={`${translatedPdfUrl}#toolbar=0`} className="w-full h-full absolute inset-0" />
                          </div>
                        )}
                        {(translatedDocumentUrl || translatedPdfUrl) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const url = translatedPdfUrl || translatedDocumentUrl;
                                if (url) downloadAuthFile(url, `translated_${file?.name || 'document'}`);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 text-[#04110F] bg-primary hover:bg-primary-dark transition py-2.5 rounded-lg font-medium text-sm shadow-lg shadow-primary/20"
                            >
                              <Download className="w-4 h-4" /> Download Translated Document
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TEXT CONTENT TAB OR STANDARD TEXT VIEW ── */}
                    {(resultTab === 'text' || (!['image', 'pdf', 'docx', 'pptx'].includes(selectedType))) && (
                      <div className="space-y-4">
                        {/* Translated Text Block */}
                        <div className="bg-background/80 rounded-xl border border-border p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2" dir="ltr">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <h4 className="text-xs font-semibold text-text-disabled uppercase">
                                {selectedType === 'image' ? 'Translated Text' : ['pdf', 'docx', 'pptx'].includes(selectedType) ? 'Translated Document Content' : 'Translated Result'} ({targetLangObj?.name})
                              </h4>
                              {translationSource && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${translationSource.includes('Memory') ? 'border-primary-dark/50 text-primary bg-primary/20' : 'border-border text-text-muted bg-surface-hover'}`}>
                                  {translationSource}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <button onClick={() => navigator.clipboard.writeText(mockResult)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                              <button onClick={() => { const blob = new Blob([mockResult], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `translated_${targetLangObj?.code}.txt`; a.click(); }} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                <Download className="w-3 h-3" /> TXT
                              </button>
                              <button onClick={() => downloadAsWord(mockResult, `translated_${targetLangObj?.code}.doc`)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                <FileText className="w-3 h-3" /> DOC
                              </button>
                              <button onClick={() => printAsPdf(mockResult)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                <File className="w-3 h-3" /> PDF
                              </button>
                              <button onClick={() => downloadAsPptx(mockResult, `translated_${targetLangObj?.code}.pptx`)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                <Presentation className="w-3 h-3" /> PPTX
                              </button>
                            </div>
                          </div>
                          <div className="font-mono text-sm text-text-main whitespace-pre-wrap leading-relaxed select-text min-h-[100px]" dir={targetLangObj?.direction || 'ltr'}>
                            {mockResult || (selectedType === 'image' ? <span className="text-text-disabled italic">No text detected</span> : null)}
                          </div>
                        </div>

                        {/* Original Text / Transcript Block */}
                        {sttResult && (
                          <div className="bg-background/40 rounded-xl border border-border p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2" dir="ltr">
                              <h4 className="text-xs font-semibold text-text-disabled uppercase">
                                {selectedType === 'image' ? 'Original Detected Text' : ['pdf', 'docx', 'pptx'].includes(selectedType) ? 'Original Document Content' : 'Original Transcript'} ({sourceLangObj?.name})
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <button onClick={() => navigator.clipboard.writeText(sttResult)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                                <button onClick={() => { const blob = new Blob([sttResult], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `original_${sourceLangObj?.code}.txt`; a.click(); }} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                  <Download className="w-3 h-3" /> TXT
                                </button>
                                <button onClick={() => downloadAsWord(sttResult, `original_${sourceLangObj?.code}.doc`)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                  <FileText className="w-3 h-3" /> DOC
                                </button>
                                <button onClick={() => printAsPdf(sttResult)} className="px-2.5 py-1 text-xs bg-surface-hover hover:bg-surface-hover hover:text-primary rounded-md border border-border text-text-main flex items-center gap-1 transition">
                                  <File className="w-3 h-3" /> PDF
                                </button>
                              </div>
                            </div>
                            <div className="font-mono text-sm text-text-muted whitespace-pre-wrap leading-relaxed select-text max-h-48 overflow-y-auto show-scrollbar" dir={sourceLangObj?.direction || 'ltr'}>
                              {sttResult}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── VIDEO TRANSLATION PLAYER ── */}
                    {selectedType === 'video' && translatedVideoUrl && (
                      <div className="bg-background/80 rounded-xl border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-text-disabled uppercase">
                          <span>Translated Video</span>
                        </div>
                        {videoBlobUrl && (
                          <video 
                            controls 
                            className="w-full aspect-video bg-black rounded-xl shadow-lg" 
                            crossOrigin="anonymous" 
                            src={videoBlobUrl}
                            controlsList="nodownload"
                          >
                            {vttBlobUrl && <track src={vttBlobUrl} kind="subtitles" srcLang={targetLang} label={targetLangObj?.name || 'Subtitles'} default />}
                          </video>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => downloadAuthFile(translatedVideoUrl!, `translated_${file?.name || 'video.mp4'}`)}
                            className="flex-1 flex items-center justify-center gap-2 text-[#04110F] bg-primary hover:bg-primary-dark transition py-2 rounded-lg font-medium text-xs sm:text-sm shadow-lg shadow-primary/20"
                          >
                            <Download className="w-4 h-4" /> Download Video
                          </button>
                          {subtitlesSrtUrl && (
                            <button
                              onClick={() => downloadAuthFile(subtitlesSrtUrl!, `subtitles_${targetLang}.srt`)}
                              className="flex items-center justify-center gap-1.5 text-text-main bg-surface-hover hover:bg-surface-hover transition py-2 px-3 rounded-lg font-medium text-xs border border-border"
                            >
                              SRT
                            </button>
                          )}
                          {subtitlesVttUrl && (
                            <button
                              onClick={() => downloadAuthFile(subtitlesVttUrl!, `subtitles_${targetLang}.vtt`)}
                              className="flex items-center justify-center gap-1.5 text-text-main bg-surface-hover hover:bg-surface-hover transition py-2 px-3 rounded-lg font-medium text-xs border border-border"
                            >
                              VTT
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── AUDIO TRANSLATION & TTS SECTION ── */}
                    {mockResult && (selectedType === 'audio' || ttsAudioUrl) && (
                      <div className="bg-background/80 rounded-xl border border-border p-4 space-y-3">
                        {!ttsAudioUrl ? (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <select 
                                value={ttsVoice} 
                                onChange={(e) => setTtsVoice(e.target.value)}
                                className="bg-primary/5 border border-primary/20 text-text-main rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option className="bg-surface text-text-main" value="default">Default Voice</option>
                                <option className="bg-surface text-text-main" value="male">Male Voice</option>
                                <option className="bg-surface text-text-main" value="female">Female Voice</option>
                              </select>
                            </div>
                            <button 
                              onClick={handleGenerateAudio} 
                              disabled={isGeneratingTTS}
                              className="flex items-center gap-2 text-[#04110F] bg-primary hover:bg-primary-dark transition px-5 py-2 rounded-lg font-medium text-xs sm:text-sm w-full sm:w-auto justify-center disabled:opacity-50"
                            >
                              {isGeneratingTTS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                              {isGeneratingTTS ? 'Generating...' : 'Listen'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-xs text-text-muted">
                              <span className="font-semibold uppercase flex items-center gap-1.5 text-text-disabled">
                                <Mic className="w-3.5 h-3.5 text-primary" /> Generated Audio
                              </span>
                              <select 
                                value={ttsSpeed} 
                                onChange={(e) => {
                                  setTtsSpeed(Number(e.target.value));
                                  const audioEl = document.getElementById('tts-audio') as HTMLAudioElement;
                                  if (audioEl) audioEl.playbackRate = Number(e.target.value);
                                }}
                                className="bg-surface-hover border border-border rounded-md px-2 py-0.5 text-xs text-text-main focus:outline-none"
                              >
                                <option className="bg-surface text-text-main" value={0.75}>0.75x</option>
                                <option className="bg-surface text-text-main" value={1}>1x Normal</option>
                                <option className="bg-surface text-text-main" value={1.5}>1.5x</option>
                                <option className="bg-surface text-text-main" value={2}>2x</option>
                              </select>
                            </div>
                            {audioBlobUrl && (
                              <audio 
                                id="tts-audio" 
                                controls 
                                src={audioBlobUrl} 
                                className="w-full h-10 rounded-lg" 
                                autoPlay
                              />
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (!audioBlobUrl) return;
                                  const a = document.createElement('a');
                                  a.href = audioBlobUrl;
                                  a.download = `translated_audio_${targetLang}.mp3`;
                                  a.click();
                                }}
                                disabled={!audioBlobUrl}
                                className="flex-1 flex items-center justify-center gap-2 text-text-main bg-surface-hover hover:bg-surface-hover transition py-2 rounded-lg font-medium text-xs disabled:opacity-50 border border-border"
                              >
                                <Download className="w-3.5 h-3.5" /> Download Audio
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional Listen Button for Text/Image when no audio is loaded yet */}
                    {mockResult && !ttsAudioUrl && selectedType !== 'audio' && (
                      <div className="flex items-center justify-between p-3 bg-background/40 rounded-xl border border-border/60 text-xs">
                        <span className="text-text-muted flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-primary" /> Want to hear the translation spoken?
                        </span>
                        <button 
                          onClick={handleGenerateAudio}
                          disabled={isGeneratingTTS}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface-hover hover:text-primary transition font-medium text-text-main disabled:opacity-50"
                        >
                          {isGeneratingTTS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          {isGeneratingTTS ? 'Synthesizing...' : 'Listen'}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}






