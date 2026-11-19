"""Read-only native grant and treaty settlement checks. Real50aaf0/525d20/524030/5243c0.
Country cash callbacks, embassy getter, date and active-country query supplied;
independent recipients only. No Windows game process or save is touched.
"""
from pathlib import Path
import sys,struct,json
sys.path.insert(0,'C:/Users/paddy/Documents/Codex/2026-09-29/referenced-chatgpt-conversation-this-is-an/work/build-libs-oct8')
import pefile
from unicorn import Uc,UC_ARCH_X86,UC_MODE_32,UC_HOOK_CODE
from unicorn.x86_const import *
root=Path(__file__).resolve().parents[1]
pe=pefile.PE('C:/Program Files/GOG Galaxy/Games/Imperialism II/Imperialism II.exe')
u=Uc(UC_ARCH_X86,UC_MODE_32);u.mem_map(0x400000,0x400000);u.mem_write(0x400000,pe.get_memory_mapped_image());u.mem_map(0x900000,0x40000)
dip,base,vt,sim,sp,stop=0x900000,0x906000,0x920000,0x922000,0x93e000,0x93f000
def w(a,f,*v):u.mem_write(a,struct.pack(f,*v))
def r(a,f):return struct.unpack(f,u.mem_read(a,struct.calcsize(f)))
w(0x7606f0,'<I',dip);w(0x75a5b8,'<I',sim);w(sim,'<I',vt)
for off,code in [(0x3c,0x923000),(0x340,0x923010),(0x328,0x923020),(0x44,0x923030),(0x48,0x923040),(0x6c,0x923050),(0xa8,0x511760)]:w(vt+off,'<I',code)
for i in range(22):
 p=base+i*0x800;w(0x760648+i*4,'<I',p);w(p,'<I',vt);w(p+0x12c,'<h',i);w(p+0x12e,'<h',-1)
 if i<6:w(0x7606a0+i*4,'<I',p)
cash=[]
def hook(uc,a,size,data):
 sizes={0x923000:0,0x923010:8,0x923020:0,0x923030:8,0x923040:4,0x923050:4,0x403d41:4,0x401a55:8,0x403a3a:4}
 if a not in sizes:return
 esp=uc.reg_read(UC_X86_REG_ESP);ret=r(esp,'<I')[0]
 if a==0x923040:cash.append(r(esp+4,'<i')[0])
 uc.reg_write(UC_X86_REG_EAX,1700 if a==0x923000 else 1 if a==0x403d41 else 2 if a==0x401a55 else 0)
 uc.reg_write(UC_X86_REG_ESP,esp+4+sizes[a]);uc.reg_write(UC_X86_REG_EIP,ret)
u.hook_add(UC_HOOK_CODE,hook)
def reset(prior=90,treaty=4):
 u.mem_write(dip,bytes(0x4000));m=[[255 if a==b else 90 for b in range(22)]for a in range(22)];m[0][6]=m[6][0]=prior;m[6][7]=m[7][6]=180
 w(dip+0x1e0,'<484h',*[v for row in m for v in row]);w(dip+0x5a8,'<484h',*[4 for i in range(484)])
 for a,b in [(0,6),(6,0)]:w(dip+0x5a8+(a*22+b)*2,'<h',treaty)
def call(addr,obj,*args):
 w(sp,'<'+'I'*(len(args)+1),stop,*args);u.reg_write(UC_X86_REG_ESP,sp);u.reg_write(UC_X86_REG_ECX,obj);u.emu_start(addr,stop,count=100000);assert u.reg_read(UC_X86_REG_EIP)==stop
grants=[]
for amount,gain in [(1000,2),(3000,4),(5000,6),(10000,10)]:
 for prior in [50,90,250,255]:
  reset(prior);cash.clear();w(base+0x24e+6*2,'<h',amount);w(base+0x21c,'<i',amount);call(0x50aaf0,base,6)
  result=r(dip+0x1e0+6*2,'<h')[0];assert result==min(255,prior+gain),(amount,prior,result);assert cash==[amount];assert r(base+0x21c,'<i')[0]==0
  grants.append(dict(amount=amount,prior=prior,relationship=result,cashDelivered=cash[0]))
pacts=[]
for prior in [50,90,150,250,255]:
 reset(prior);call(0x525d20,dip,0,6,3,1);after=r(dip+0x1e0+12,'<h')[0];assert after==min(255,prior+10)
 # Native declaration from status3. Compare identical prior status4: no invented multiplier.
 call(0x525d20,dip,0,6,6,1);broken=list(r(dip+0x1e0,'<484h'))
 reset(after,4);call(0x525d20,dip,0,6,6,1);normal=list(r(dip+0x1e0,'<484h'));assert broken==normal
 pacts.append(dict(prior=prior,afterPact=after,afterDeclaration=broken[6],observerAfterDeclaration=broken[7],sameAsNativeDeclarationWithSamePrior=True))
(root/'outputs/Native-diplomacy244-reference.json').write_text(json.dumps(dict(scope=__doc__,grants=grants,pacts=pacts),indent=2))
print('PASS:16 native grants,5 pact bonuses and5 pact-breaking declarations; no extra multiplier in this settlement path')
