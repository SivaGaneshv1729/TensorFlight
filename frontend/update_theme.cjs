const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const classReplacements = {
  // Colors and Backgrounds
  'bg-slate-950': 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900',
  'bg-slate-900': 'bg-emerald-950/40 backdrop-blur-xl',
  'bg-slate-800': 'bg-emerald-900/40 backdrop-blur-md shadow-inner shadow-emerald-500/10',
  'border-slate-700': 'border-emerald-500/20',
  'border-slate-800': 'border-emerald-500/10',
  'border-slate-500': 'border-emerald-400/40',
  'text-slate-400': 'text-emerald-200/80',
  'text-slate-500': 'text-emerald-300/60',
  'text-slate-200': 'text-emerald-50',
  'text-slate-600': 'text-emerald-400/40',
  'text-slate-700': 'text-emerald-500/40',
  'bg-black/40': 'bg-teal-950/40 backdrop-blur-md border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]',
  'bg-black/80': 'bg-teal-950/80 backdrop-blur-lg border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.2)]',
  'bg-black/20': 'bg-teal-950/20 backdrop-blur-sm',
  
  // Specific UI elements updates
  'bg-green-500': 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]',
  'text-green-500': 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
  'text-green-400': 'text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.5)]',
  'text-blue-400': 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
  'bg-blue-600': 'bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.6)]',
  'text-amber-500': 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
  'bg-amber-600': 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]',
  'text-red-500': 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  'bg-red-500': 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]',
  
  // Borders and glow
  'border-white/5': 'border-emerald-500/10',
  'border-white/10': 'border-emerald-500/20',
  'bg-white/5': 'bg-emerald-500/5',
  
  // Font styling
  'font-mono': 'font-mono tracking-wide',
  'uppercase': 'uppercase tracking-wider'
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [oldClass, newClass] of Object.entries(classReplacements)) {
        // Use a regex with word boundaries to avoid partial matches
        // e.g. bg-slate-900 should not match bg-slate-9000
        // Need to be careful with characters like '/', so escape oldClass
        const escapedOldClass = oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Word boundary doesn't work well with / or - sometimes, so we use a lookaround
        const regex = new RegExp(`(?<=[\\s\`"'])${escapedOldClass}(?=[\\s\`"'])`, 'g');
        
        if (content.match(regex)) {
          content = content.replace(regex, newClass);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Theme redesign completed.');
