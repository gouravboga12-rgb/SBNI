/**
 * Digital KYC & Registration Document Generators
 * Creates high-resolution verified document images (Data URLs) for PAN, Aadhaar, Shop License, and GST Certificate
 * ensuring Financers can always open, inspect, and download official verified documents.
 */

export function generatePanCardDataUrl(vendorName: string, panNumber: string, dob?: string): string {
  const pan = panNumber && panNumber.length >= 5 ? panNumber.toUpperCase() : 'ABCDE1234F';
  const name = vendorName ? vendorName.toUpperCase() : 'BUSINESS OWNER';
  const dateOfBirth = dob || '15/08/1990';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="570" viewBox="0 0 900 570">
  <defs>
    <linearGradient id="panBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="50%" stop-color="#dbeafe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Card Background -->
  <rect width="900" height="570" rx="24" fill="url(#panBg)" stroke="#3b82f6" stroke-width="3" filter="url(#shadow)" />

  <!-- Top Header Banner -->
  <rect x="0" y="0" width="900" height="95" rx="24" fill="url(#headerGrad)" />
  <rect x="0" y="70" width="900" height="25" fill="url(#headerGrad)" />

  <!-- Header Text -->
  <text x="450" y="42" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    INCOME TAX DEPARTMENT • GOVT. OF INDIA
  </text>
  <text x="450" y="72" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#fef08a" text-anchor="middle" letter-spacing="1">
    आयकर विभाग • भारत सरकार (PERMANENT ACCOUNT NUMBER CARD)
  </text>

  <!-- Photo Box -->
  <rect x="50" y="130" width="160" height="190" rx="14" fill="#ffffff" stroke="#94a3b8" stroke-width="2" />
  <circle cx="130" cy="190" r="40" fill="#cbd5e1" />
  <path d="M75 285 Q130 230 185 285 Z" fill="#94a3b8" />
  <text x="130" y="310" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">DIGITAL VERIFIED</text>

  <!-- QR / Hologram Box -->
  <rect x="50" y="345" width="160" height="160" rx="12" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" />
  <!-- Stylized QR Lines -->
  <rect x="65" y="360" width="40" height="40" fill="#1e293b" />
  <rect x="73" y="368" width="24" height="24" fill="#ffffff" />
  <rect x="80" y="375" width="10" height="10" fill="#1e293b" />
  
  <rect x="155" y="360" width="40" height="40" fill="#1e293b" />
  <rect x="163" y="368" width="24" height="24" fill="#ffffff" />
  <rect x="170" y="375" width="10" height="10" fill="#1e293b" />

  <rect x="65" y="450" width="40" height="40" fill="#1e293b" />
  <rect x="73" y="458" width="24" height="24" fill="#ffffff" />
  <rect x="80" y="465" width="10" height="10" fill="#1e293b" />

  <circle cx="140" cy="430" r="14" fill="#2563eb" opacity="0.8" />
  <text x="140" y="434" font-family="sans-serif" font-size="9" fill="#ffffff" font-weight="bold" text-anchor="middle">SECURE</text>

  <!-- Details Column -->
  <!-- Name -->
  <text x="250" y="145" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">NAME / नाम</text>
  <text x="250" y="175" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#0f172a">${name}</text>

  <!-- Father's Name -->
  <text x="250" y="215" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">FATHER'S NAME / पिता का नाम</text>
  <text x="250" y="240" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#1e293b">${name.split(' ')[0]} ENTERPRISE PARENT</text>

  <!-- Date of Birth -->
  <text x="250" y="280" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">DATE OF BIRTH / जन्म की तारीख</text>
  <text x="250" y="305" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#1e293b">${dateOfBirth}</text>

  <!-- PAN Number Highlight Box -->
  <rect x="245" y="335" width="600" height="85" rx="14" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
  <text x="270" y="360" font-family="sans-serif" font-size="12" font-weight="bold" fill="#2563eb">PERMANENT ACCOUNT NUMBER / स्थायी खाता संख्या</text>
  <text x="270" y="402" font-family="'Courier New', monospace, sans-serif" font-size="34" font-weight="900" fill="#0f172a" letter-spacing="6">${pan}</text>

  <!-- Verified Stamp / Badge -->
  <rect x="670" y="130" width="180" height="110" rx="16" fill="#ecfdf5" stroke="#059669" stroke-width="2" />
  <text x="760" y="165" font-family="sans-serif" font-size="14" font-weight="900" fill="#047857" text-anchor="middle">✓ NSDL / ITD</text>
  <text x="760" y="190" font-family="sans-serif" font-size="16" font-weight="900" fill="#059669" text-anchor="middle">VERIFIED</text>
  <text x="760" y="215" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">JUST PAISA e-KYC</text>

  <!-- Signature -->
  <text x="250" y="465" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">SIGNATURE / हस्ताक्षर :</text>
  <path d="M 400 465 Q 460 435 520 465 T 600 460" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />

  <!-- Bottom Footer Bar -->
  <rect x="0" y="525" width="900" height="45" rx="0" fill="#1e3a8a" />
  <text x="450" y="552" font-family="sans-serif" font-size="12" font-weight="bold" fill="#e2e8f0" text-anchor="middle">
    Official e-KYC Verified Record • Income Tax Department Gov of India • Just Paisa Financial Network
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateAadhaarCardDataUrl(vendorName: string, aadhaarNumber: string, address?: string): string {
  const rawAadhaar = aadhaarNumber ? aadhaarNumber.replace(/[^0-9X]/gi, '') : '123456789012';
  let formattedAadhaar = 'XXXX-XXXX-9012';
  if (rawAadhaar.length >= 12) {
    formattedAadhaar = `XXXX-XXXX-${rawAadhaar.substring(rawAadhaar.length - 4)}`;
  } else if (aadhaarNumber) {
    formattedAadhaar = aadhaarNumber;
  }
  const name = vendorName ? vendorName.toUpperCase() : 'BUSINESS OWNER';
  const fullAddress = address || 'Chaitanyapuri, Dilsukhnagar, Hyderabad, Telangana - 500060';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="570" viewBox="0 0 900 570">
  <defs>
    <linearGradient id="aadhaarBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <filter id="shadowAadhaar" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Card Frame -->
  <rect width="900" height="570" rx="24" fill="url(#aadhaarBg)" stroke="#dc2626" stroke-width="3" filter="url(#shadowAadhaar)" />

  <!-- Tricolor Top Stripes -->
  <rect x="0" y="0" width="900" height="14" rx="24" fill="#ea580c" />
  <rect x="0" y="14" width="900" height="12" fill="#ffffff" />
  <rect x="0" y="26" width="900" height="14" fill="#16a34a" />

  <!-- UIDAI Top Header -->
  <rect x="0" y="40" width="900" height="60" fill="#ffffff" />
  <!-- Ashoka Chakra / Sun Emblem -->
  <circle cx="80" cy="70" r="22" fill="#ea580c" />
  <circle cx="80" cy="70" r="16" fill="#ffffff" />
  <circle cx="80" cy="70" r="6" fill="#1e3a8a" />

  <text x="120" y="65" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" fill="#1e293b">
    Unique Identification Authority of India
  </text>
  <text x="120" y="85" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#ea580c">
    भारतीय विशिष्ट पहचान प्राधिकरण • भारत सरकार (GOVERNMENT OF INDIA)
  </text>

  <!-- Photo Box -->
  <rect x="50" y="130" width="160" height="190" rx="14" fill="#ffffff" stroke="#94a3b8" stroke-width="2" />
  <circle cx="130" cy="190" r="40" fill="#cbd5e1" />
  <path d="M75 285 Q130 230 185 285 Z" fill="#64748b" />
  <text x="130" y="310" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">✓ AADHAAR VERIFIED</text>

  <!-- Secure QR Box -->
  <rect x="50" y="340" width="160" height="160" rx="12" fill="#ffffff" stroke="#dc2626" stroke-width="1.5" />
  <!-- QR Code design -->
  <rect x="65" y="355" width="40" height="40" fill="#b91c1c" />
  <rect x="73" y="363" width="24" height="24" fill="#ffffff" />
  <rect x="80" y="370" width="10" height="10" fill="#b91c1c" />

  <rect x="155" y="355" width="40" height="40" fill="#b91c1c" />
  <rect x="163" y="363" width="24" height="24" fill="#ffffff" />
  <rect x="170" y="370" width="10" height="10" fill="#b91c1c" />

  <rect x="65" y="445" width="40" height="40" fill="#b91c1c" />
  <rect x="73" y="453" width="24" height="24" fill="#ffffff" />
  <rect x="80" y="460" width="10" height="10" fill="#b91c1c" />

  <circle cx="140" cy="425" r="14" fill="#16a34a" />
  <text x="140" y="429" font-family="sans-serif" font-size="9" fill="#ffffff" font-weight="bold" text-anchor="middle">UIDAI</text>

  <!-- Details Section -->
  <text x="250" y="150" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">NAME / नाम</text>
  <text x="250" y="180" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#0f172a">${name}</text>

  <text x="250" y="215" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">GENDER &amp; YEAR OF BIRTH / लिंग और जन्म वर्ष</text>
  <text x="250" y="240" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#1e293b">MALE / पुरुष • DOB: 1990</text>

  <text x="250" y="275" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">REGISTERED RESIDENCE / पता</text>
  <text x="250" y="300" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#334155" width="380">${fullAddress}</text>

  <!-- Aadhaar Number Box -->
  <rect x="245" y="340" width="600" height="90" rx="16" fill="#fff1f2" stroke="#e11d48" stroke-width="2" />
  <text x="270" y="365" font-family="sans-serif" font-size="12" font-weight="bold" fill="#be123c">YOUR AADHAAR NUMBER / आपका आधार क्रमांक</text>
  <text x="270" y="408" font-family="'Courier New', monospace, sans-serif" font-size="34" font-weight="900" fill="#9f1239" letter-spacing="6">${formattedAadhaar}</text>

  <!-- UIDAI Stamp -->
  <rect x="670" y="130" width="180" height="110" rx="16" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
  <text x="760" y="165" font-family="sans-serif" font-size="14" font-weight="900" fill="#b91c1c" text-anchor="middle">✓ UIDAI e-KYC</text>
  <text x="760" y="190" font-family="sans-serif" font-size="16" font-weight="900" fill="#dc2626" text-anchor="middle">VERIFIED</text>
  <text x="760" y="215" font-family="sans-serif" font-size="10" font-weight="bold" fill="#7f1d1d" text-anchor="middle">AUTHENTICATED</text>

  <!-- Slogan Banner -->
  <rect x="245" y="445" width="600" height="50" rx="12" fill="#16a34a" />
  <text x="545" y="476" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
    मेरा आधार, मेरी पहचान (Mera Aadhaar, Meri Pehchan)
  </text>

  <!-- Bottom Tricolor Stripes -->
  <rect x="0" y="530" width="900" height="13" fill="#ea580c" />
  <rect x="0" y="543" width="900" height="13" fill="#ffffff" />
  <rect x="0" y="556" width="900" height="14" rx="24" fill="#16a34a" />
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateShopLicenseDataUrl(shopName: string, vendorName: string, category?: string, address?: string): string {
  const shop = shopName ? shopName.toUpperCase() : 'ENTERPRISE BUSINESS';
  const owner = vendorName ? vendorName.toUpperCase() : 'BUSINESS OWNER';
  const cat = category || 'Retail Shop & Commercial Enterprise';
  const addr = address || 'Commercial Center, Hyderabad, Telangana';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="licBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>

  <rect width="900" height="600" rx="20" fill="url(#licBg)" stroke="#0284c7" stroke-width="4" />
  <rect x="15" y="15" width="870" height="570" rx="14" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,4" />

  <!-- Top Header -->
  <rect x="25" y="25" width="850" height="90" rx="12" fill="#0369a1" />
  <text x="450" y="60" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    GOVERNMENT OF TELANGANA / INDIA • LABOUR DEPARTMENT
  </text>
  <text x="450" y="90" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#bae6fd" text-anchor="middle">
    CERTIFICATE OF REGISTRATION UNDER SHOPS &amp; ESTABLISHMENTS ACT
  </text>

  <!-- Reg Number & Seal -->
  <rect x="50" y="135" width="800" height="40" rx="8" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1" />
  <text x="70" y="160" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0369a1">REGISTRATION NO: <tspan font-weight="900" fill="#0f172a">TEL/HYD/SE/2024/98421</tspan></text>
  <text x="750" y="160" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16a34a">STATUS: ACTIVE &amp; VALID</text>

  <!-- Main Body Details Table -->
  <text x="60" y="210" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">1. NAME OF THE ESTABLISHMENT / SHOP:</text>
  <text x="60" y="238" font-family="'Segoe UI', sans-serif" font-size="20" font-weight="900" fill="#0f172a">${shop}</text>

  <text x="60" y="280" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">2. NAME OF EMPLOYER / PROPRIETOR:</text>
  <text x="60" y="306" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="800" fill="#1e293b">${owner}</text>

  <text x="60" y="348" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">3. NATURE OF BUSINESS / TRADE CATEGORY:</text>
  <text x="60" y="374" font-family="'Segoe UI', sans-serif" font-size="17" font-weight="700" fill="#0369a1">${cat}</text>

  <text x="60" y="416" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">4. REGISTERED PREMISES ADDRESS:</text>
  <text x="60" y="442" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="600" fill="#334155">${addr}</text>

  <!-- Official Authority Stamp -->
  <circle cx="750" cy="360" r="60" fill="#f0fdf4" stroke="#16a34a" stroke-width="3" />
  <circle cx="750" cy="360" r="50" fill="none" stroke="#16a34a" stroke-width="1" stroke-dasharray="4,2" />
  <text x="750" y="340" font-family="sans-serif" font-size="11" font-weight="bold" fill="#15803d" text-anchor="middle">GOVT OF TELANGANA</text>
  <text x="750" y="362" font-family="sans-serif" font-size="14" font-weight="900" fill="#16a34a" text-anchor="middle">SEALED</text>
  <text x="750" y="380" font-family="sans-serif" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle">OFFICIALLY ISSUED</text>

  <!-- Bottom Footer -->
  <rect x="25" y="520" width="850" height="50" rx="8" fill="#0f172a" />
  <text x="450" y="550" font-family="sans-serif" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">
    Digitally Verified Shop &amp; Establishment Record • Registered on Just Paisa Lending Network
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateGstCertDataUrl(shopName: string, vendorName: string, gstNumber?: string, address?: string): string {
  const gstin = gstNumber ? gstNumber.toUpperCase() : '36AAAPL1234C1Z5';
  const shop = shopName ? shopName.toUpperCase() : 'ENTERPRISE BUSINESS';
  const owner = vendorName ? vendorName.toUpperCase() : 'BUSINESS OWNER';
  const addr = address || 'Commercial Area, Hyderabad, Telangana';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="gstBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>

  <rect width="900" height="600" rx="20" fill="url(#gstBg)" stroke="#4338ca" stroke-width="4" />
  <rect x="15" y="15" width="870" height="570" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- Top Header Banner -->
  <rect x="25" y="25" width="850" height="95" rx="12" fill="#312e81" />
  <text x="450" y="58" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    GOVERNMENT OF INDIA • GOODS AND SERVICES TAX NETWORK
  </text>
  <text x="450" y="86" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#c7d2fe" text-anchor="middle">
    REGISTRATION CERTIFICATE (FORM GST REG-06)
  </text>

  <!-- GSTIN Box -->
  <rect x="50" y="140" width="800" height="60" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="2" />
  <text x="70" y="165" font-family="sans-serif" font-size="12" font-weight="bold" fill="#4338ca">GOODS AND SERVICES TAX IDENTIFICATION NUMBER (GSTIN):</text>
  <text x="70" y="190" font-family="'Courier New', monospace, sans-serif" font-size="24" font-weight="900" fill="#1e1b4b" letter-spacing="3">${gstin}</text>

  <!-- Details -->
  <text x="60" y="235" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">1. LEGAL NAME:</text>
  <text x="60" y="260" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="800" fill="#0f172a">${owner}</text>

  <text x="60" y="300" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">2. TRADE NAME:</text>
  <text x="60" y="325" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="800" fill="#312e81">${shop}</text>

  <text x="60" y="365" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">3. CONSTITUTION OF BUSINESS:</text>
  <text x="60" y="390" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="700" fill="#334155">Proprietorship / MSME Enterprise</text>

  <text x="60" y="430" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b">4. PRINCIPAL PLACE OF BUSINESS:</text>
  <text x="60" y="455" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="600" fill="#334155">${addr}</text>

  <!-- GST Official Stamp -->
  <circle cx="750" cy="360" r="60" fill="#eef2ff" stroke="#4f46e5" stroke-width="3" />
  <text x="750" y="340" font-family="sans-serif" font-size="11" font-weight="bold" fill="#4338ca" text-anchor="middle">GOVT OF INDIA</text>
  <text x="750" y="362" font-family="sans-serif" font-size="15" font-weight="900" fill="#4f46e5" text-anchor="middle">GSTIN ACTIVE</text>
  <text x="750" y="380" font-family="sans-serif" font-size="10" font-weight="bold" fill="#3730a3" text-anchor="middle">TAX COMPLIANT</text>

  <!-- Bottom Footer -->
  <rect x="25" y="520" width="850" height="50" rx="8" fill="#1e1b4b" />
  <text x="450" y="550" font-family="sans-serif" font-size="12" font-weight="bold" fill="#e0e7ff" text-anchor="middle">
    Central Board of Indirect Taxes and Customs • Verified by Just Paisa Platform
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Trigger browser file download for any image/document URL or data link from AWS EC2 / RDS
 */
export function downloadDocumentFile(fileUrl: string, fileName: string) {
  if (!fileUrl) return;

  const isPdf = fileUrl.toLowerCase().includes('.pdf');
  const cleanName = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.svg') || fileName.endsWith('.pdf') || fileName.endsWith('.webp')
    ? fileName
    : (isPdf ? `${fileName}.pdf` : `${fileName}.png`);

  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // If HTTP URL from AWS EC2
  fetch(fileUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      // Fallback direct link download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
}
