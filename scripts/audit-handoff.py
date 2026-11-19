from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
rules={
 'github-token':r'(?:gh[pousr]_[A-Za-z0-9]{24,}|github_pat_[A-Za-z0-9_]{40,})',
 'api-token':r'sk-(?:proj-)?[A-Za-z0-9_-]{32,}',
 'private-key':r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
 'literal-auth':r'(?i)(?:access_token|oauth_token|api_key|authorization)\s*[=:]\s*[\"\x27](?:Bearer )?[A-Za-z0-9_./+-]{30,}[\"\x27]'}
forbidden={'.keystore','.jks','.pem','.key','.p12','.hprof','.exe','.dll','.apk','.aab'}
findings=[];total=0;largest=[]
for p in root.rglob('*'):
 if not p.is_file() or '.git' in p.parts or 'node_modules' in p.parts:continue
 rel=p.relative_to(root).as_posix()
 if rel.startswith('work/handoff-'):continue
 total+=p.stat().st_size;largest.append((p.stat().st_size,rel))
 if p.suffix.lower() in forbidden:findings.append({'path':rel,'rule':'excluded-file-type'})
 if p.name=='.env' or p.name.endswith(('.env.local','.env.production')):findings.append({'path':rel,'rule':'environment-secrets-file'})
 if p.suffix.lower() not in {'.mjs','.js','.cjs','.py','.json','.html','.css','.md','.txt','.ps1','.xml'} or p==Path(__file__).resolve():continue
 try:text=p.read_text(encoding='utf-8')
 except UnicodeError:continue
 for name,pattern in rules.items():
  for match in re.finditer(pattern,text):
   findings.append({'path':rel,'rule':name,'line':text.count('\n',0,match.start())+1})
report={'checkedBytes':total,'findings':findings,'largestFiles':[{'path':p,'bytes':n} for n,p in sorted(largest,reverse=True)[:10]]}
(root/'docs/handoff-content-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'findings':findings,'totalMiB':round(total/1048576,1),'largestMiB':round(max(n for n,_ in largest)/1048576,1)}))
raise SystemExit(bool(findings))
