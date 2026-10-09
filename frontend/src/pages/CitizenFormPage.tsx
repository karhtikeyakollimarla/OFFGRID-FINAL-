import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitComplaint } from '../api/client';
import { LocationPickerMap } from '../components/LocationPickerMap';
import {
  Send,
  MapPin,
  Mic,
  MicOff,
  Image as ImageIcon,
  AlertCircle,
  Trash2,
  Info,
  CheckCircle,
  FileText,
  SearchCode
} from 'lucide-react';

const EXAMPLE_COMPLAINTS = [
  {
    label: 'College gate pothole',
    text: 'There is a huge pothole near our college gate, and two people almost fell today.',
    loc: 'College Gate, Sector 4'
  },
  {
    label: 'Live electrical wire',
    text: 'Live wire is sparking near the school bus stop, please send someone immediately children are playing nearby!',
    loc: 'Near St. Mary School Bus Stop'
  },
  {
    label: 'Water pipeline leak',
    text: 'Drinking water pipeline is leaking heavily outside hospital gate for 3 days.',
    loc: 'District Civil Hospital Gate'
  }
];

export const CitizenFormPage: React.FC = () => {
  const navigate = useNavigate();

  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [rawText, setRawText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Web Speech API Voice Input
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>('en-IN');

  const handleStartSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is supported in Chrome, Edge, and Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setRawText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice input error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Attached photo must be smaller than 10MB.');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const applyExample = (ex: typeof EXAMPLE_COMPLAINTS[0]) => {
    setRawText(ex.text);
    setLocationText(ex.loc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim()) {
      setErrorMsg('Please provide your full name.');
      return;
    }
    if (!citizenEmail.trim() || !citizenEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address for status notifications.');
      return;
    }
    if (!rawText.trim() || rawText.trim().length < 5) {
      setErrorMsg('Please provide a brief description of the issue (at least 5 characters).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('citizen_name', citizenName.trim());
      formData.append('citizen_email', citizenEmail.trim());
      formData.append('raw_text', rawText.trim());
      if (locationText.trim()) formData.append('location_text', locationText.trim());
      if (lat !== null) formData.append('latitude', String(lat));
      if (lng !== null) formData.append('longitude', String(lng));
      if (photo) formData.append('photo', photo);

      const ticket = await submitComplaint(formData);
      navigate(`/ticket/${ticket.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while submitting your service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F4F7FA] min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[#64748B] flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#172B4D] hover:underline">Home</Link>
          <span>/</span>
          <span>Service Requests</span>
          <span>/</span>
          <span className="text-[#172B4D] font-semibold">New Request</span>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D] tracking-tight">
            Submit a service request
          </h1>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Describe the issue in your area. We'll help route it to the appropriate department.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Complaint Form (approx 68% width -> lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#DCE4EC] rounded-lg shadow-sm p-6 sm:p-7">
            
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Validation & Error Alert */}
              {errorMsg && (
                <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-[#DC2626] rounded-md text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Citizen Details Row (2 columns on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="citizen_name" className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                    Your full name <span className="text-[#DC2626] font-bold">*</span>
                  </label>
                  <input
                    id="citizen_name"
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full text-sm rounded-md border border-[#DCE4EC] px-3.5 py-2.5 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="citizen_email" className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                    Email address <span className="text-[#DC2626] font-bold">*</span>
                  </label>
                  <input
                    id="citizen_email"
                    type="email"
                    required
                    placeholder="e.g. priya.sharma@example.com"
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    className="w-full text-sm rounded-md border border-[#DCE4EC] px-3.5 py-2.5 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Tracking references and resolution updates will be sent here.
                  </p>
                </div>
              </div>

              {/* Issue Description Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label htmlFor="raw_text" className="block text-xs font-semibold text-[#172B4D]">
                    Describe the issue <span className="text-[#DC2626] font-bold">*</span>
                  </label>

                  {/* Language Selector & Voice Input */}
                  <div className="flex items-center gap-2">
                    <select
                      value={speechLang}
                      onChange={(e) => setSpeechLang(e.target.value as any)}
                      aria-label="Dictation Language"
                      className="text-xs border border-[#DCE4EC] rounded px-2 py-1 bg-slate-50 text-[#172B4D] focus:outline-none focus:border-[#0D9488]"
                    >
                      <option value="en-IN">English (India)</option>
                      <option value="hi-IN">Hindi (हिन्दी)</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleStartSpeech}
                      disabled={isListening}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                        isListening
                          ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-[#DCE4EC]'
                      }`}
                      title="Dictate description with voice"
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5 text-red-600" /> : <Mic className="w-3.5 h-3.5 text-[#0D9488]" />}
                      <span>{isListening ? 'Listening...' : 'Voice input'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  id="raw_text"
                  rows={4}
                  required
                  placeholder="Explain what needs attention, visible hazards, or how long it has been an issue... (English, Hindi, or Hinglish accepted)"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full text-sm rounded-md border border-[#DCE4EC] p-3 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors leading-relaxed min-h-[110px]"
                />

                {/* Character Count & Example Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-[#64748B]">Common examples:</span>
                    {EXAMPLE_COMPLAINTS.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyExample(ex)}
                        className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-[#0D9488] border border-[#DCE4EC] hover:border-[#0D9488] px-2 py-0.5 rounded text-[#172B4D] transition-colors"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] text-[#64748B] self-end sm:self-auto font-mono">
                    {rawText.length} characters
                  </span>
                </div>
              </div>

              {/* Location Text & Landmark */}
              <div>
                <label htmlFor="location_text" className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                  Location or landmark <span className="text-[#64748B] font-normal">(optional)</span>
                </label>
                <input
                  id="location_text"
                  type="text"
                  placeholder="e.g. Opposite Metro Gate 3, Sector 4 Main Road"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="w-full text-sm rounded-md border border-[#DCE4EC] px-3.5 py-2.5 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
                />
              </div>

              {/* Interactive Location Map */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#172B4D]">
                  Pinpoint location on map <span className="text-[#64748B] font-normal">(optional)</span>
                </label>
                <div className="border border-[#DCE4EC] rounded-md overflow-hidden p-2 bg-slate-50/50">
                  <LocationPickerMap
                    lat={lat}
                    lng={lng}
                    onChange={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                    height="210px"
                  />
                </div>
              </div>

              {/* Photo Upload Attachment */}
              <div className="pt-2 border-t border-[#DCE4EC]">
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                  Attach photo <span className="text-[#64748B] font-normal">(optional — JPG, PNG up to 10MB)</span>
                </label>

                {!photoPreview ? (
                  <label className="flex items-center justify-center gap-3 border border-dashed border-[#DCE4EC] hover:border-[#0D9488] rounded-md p-3.5 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors text-xs text-[#64748B]">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <span>Upload image of the defect or area</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-[#DCE4EC] rounded-md">
                    <img src={photoPreview} alt="Selected preview" className="w-14 h-14 object-cover rounded border border-[#DCE4EC]" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-medium text-[#172B4D] truncate">{photo?.name}</p>
                      <p className="text-[11px] text-[#64748B] font-mono">
                        {photo ? `${(photo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 rounded-md bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting service request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit complaint</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Right Column: Guidance Panel (approx 32% width -> lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Guidance Panel */}
            <div className="bg-white border border-[#DCE4EC] rounded-lg p-5 shadow-sm text-xs space-y-4">
              <h2 className="font-bold text-sm text-[#172B4D] border-b border-[#DCE4EC] pb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0D9488]" />
                Before you submit
              </h2>

              <ul className="space-y-3 text-[#172B4D] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-1.5 shrink-0" />
                  <span><strong>Describe what happened and where.</strong> Clear, specific descriptions help dispatch the right field team.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-1.5 shrink-0" />
                  <span><strong>Include a nearby landmark</strong> or street number when exact GPS coordinates are unavailable.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-1.5 shrink-0" />
                  <span><strong>Add a photo</strong> if it helps municipal teams assess equipment needed for repairs.</span>
                </li>
              </ul>
            </div>

            {/* Tracking Note */}
            <div className="bg-white border border-[#DCE4EC] rounded-lg p-5 shadow-sm text-xs space-y-3">
              <h3 className="font-bold text-xs text-[#172B4D] uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                <SearchCode className="w-4 h-4 text-[#0D9488]" />
                Tracking your request
              </h3>
              <p className="text-[#64748B] leading-relaxed">
                Once submitted, you will receive an official tracking reference (e.g. <code>CIV-00001</code>) and email status updates as officers inspect and resolve your issue.
              </p>
              <div className="pt-2">
                <Link
                  to="/track"
                  className="text-[#0D9488] hover:text-[#0F766E] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Already have a reference? Track here &rarr;
                </Link>
              </div>
            </div>

            {/* Responsible Department Note */}
            <div className="bg-white border border-[#DCE4EC] rounded-lg p-5 shadow-sm text-xs space-y-2 text-[#64748B] leading-relaxed">
              <h3 className="font-bold text-xs text-[#172B4D] uppercase tracking-wider">
                Municipal triage
              </h3>
              <p>
                Service requests are analyzed and routed to Public Works (Roads), Sanitation, Water Supply, Drainage, or Electrical & Lighting divisions based on safety risk and reported location.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
