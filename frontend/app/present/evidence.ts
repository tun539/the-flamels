export type CuratedSource = {
  id: string; title: string; summary: string; url: string; locator: string;
  limitations: string; status: string; scope: string;
  findings: {id: string; text: string; type: string; locator: string}[];
};
export type EvidenceResult = {
  id: string; document_id: string; text: string; type: string; locator: string;
  title: string; url: string; limitations: string;
};
/** Deterministic lexical retrieval. A match is not an inference or confidence score. */
export function retrieveEvidence(question: string, sources: CuratedSource[]): EvidenceResult[] {
  const stop = new Set(['a','an','the','and','or','of','in','on','for','to','is','are','what','which','how','does','do','can','with','about','me','show','find']);
  const terms = [...new Set((question.toLowerCase().match(/[a-z0-9]+/g) || []).filter(t => !stop.has(t)))].slice(0, 24);
  if (!terms.length) return [];
  const accession = question.trim().match(/^psi[- ]?(\d+)$/i);
  return sources.filter(s => s.status === 'reviewed' && s.scope !== 'context_only' && (!accession || s.id === `psi-${accession[1]}`))
    .flatMap(s => [{id:s.id+'-summary',text:s.summary,type:'source_summary',locator:s.locator},...s.findings].map(f => {
      const text = (s.id+' '+s.title+' '+f.text).toLowerCase();
      const score = terms.filter(t => text.includes(t)).length;
      return {score, id:f.id, document_id:s.id, text:f.text, type:f.type, locator:f.locator, title:s.title, url:s.url, limitations:s.limitations};
    })).filter(c => c.score > 0).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id)).slice(0,8)
    .map(({score: _score,...result}) => result);
}
