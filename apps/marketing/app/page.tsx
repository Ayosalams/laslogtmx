import React from 'react';

export default function MarketingHome() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Tailwind Play CDN for zero-config demo styling on static export. Replace with proper Tailwind + shared pkgs later. */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        tailwind.config = { theme: { extend: { colors: { 'tmx-blue': '#00bfff' } } } };
      ` }} />
      
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div style={{width: '36px', height: '36px', background: '#0F172A', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>TMX</div>
          <span className="text-2xl font-semibold text-[#0F172A]">laslogTMX</span>
        </div>
        <nav className="flex gap-6 text-sm">
          <a href="#features" className="text-[#64748B] hover:text-[#00bfff]">Features</a>
          <a href="https://app.laslogtmx.com/pricing" className="text-[#64748B] hover:text-[#00bfff]">Pricing</a>
          <a href="https://app.laslogtmx.com/auth/login" className="text-[#64748B] hover:text-[#00bfff]">Log in</a>
          <a href="https://app.laslogtmx.com/auth/signup" className="px-4 py-2 bg-[#00bfff] text-white rounded-xl text-sm font-medium hover:bg-[#0099cc]">Get Started</a>
        </nav>
      </header>

      <main>
        <section className="text-center py-16">
          <div className="inline px-4 py-1 rounded-full bg-sky-100 text-[#00bfff] text-xs tracking-widest mb-4">TRANSPORT MANAGEMENT XPERIENCE</div>
          <h1 className="text-6xl font-bold text-[#0F172A] leading-tight mt-3">The modern TMS<br />for carriers &amp; brokers.</h1>
          <p className="mt-4 text-xl text-[#64748B] max-w-md mx-auto">Military time. Real-time team chat. Receipt OCR. FMCSA compliance. Built for the road.</p>
          <div className="mt-8 flex gap-4 justify-center">
            <a href="https://app.laslogtmx.com/auth/signup" className="inline-block px-8 py-3 bg-[#00bfff] text-white rounded-2xl font-semibold hover:bg-[#0099cc]">Start free trial</a>
            <a href="https://app.laslogtmx.com/auth/login" className="inline-block px-8 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50">Log in to app</a>
          </div>
          <p className="mt-3 text-xs text-[#94A3B8]">No credit card required • Works great on mobile</p>
        </section>

        <section id="features" className="grid md:grid-cols-3 gap-6 py-12">
          {[
            { icon: '⏰', title: 'Military Time', desc: 'Default everywhere. No AM/PM confusion on the road or in logs.' },
            { icon: '💬', title: 'Team + Load Chat', desc: 'Realtime company chat and per-load threads. Attachments supported.' },
            { icon: '🧾', title: 'Receipt OCR', desc: 'Snap photos, auto-extract, mandatory correction step before submit.' },
            { icon: '🛡️', title: 'MOTUS + Compliance', desc: 'FMCSA status, DOT claims, troubleshooting library for drivers.' },
            { icon: '🚛', title: 'Internal Load Board', desc: 'Post, bid, negotiate loads inside your company. Full audit trail.' },
            { icon: '📱', title: 'Mobile First', desc: 'Expo-powered native app. Same data, offline capable features.' },
          ].map((f, i) => (
            <div key={i} className="border border-[#E2E8F0] rounded-3xl p-6 hover:border-[#00bfff] transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="font-semibold text-lg text-[#0F172A]">{f.title}</div>
              <div className="text-[#64748B] mt-2 text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </section>

        <section className="bg-[#0F172A] text-white rounded-3xl p-10 text-center my-12">
          <h2 className="text-3xl font-bold">Ready to modernize your ops?</h2>
          <p className="text-[#94A3B8] mt-2">Join carriers running on laslogTMX.</p>
          <a href="https://app.laslogtmx.com/auth/signup" className="mt-6 inline-block bg-white text-[#0F172A] px-6 py-3 rounded-2xl font-semibold">Create account →</a>
        </section>
      </main>

      <footer className="text-center text-xs text-[#94A3B8] pt-8 border-t mt-12">
        © {new Date().getFullYear()} laslogTMX — <a href="https://app.laslogtmx.com" className="underline">app.laslogtmx.com</a>
      </footer>
    </div>
  );
}
