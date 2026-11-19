from pathlib import Path
import sys,json
sys.path.insert(0,'C:/Users/paddy/Documents/Codex/2026-09-29/referenced-chatgpt-conversation-this-is-an/work/build-libs-oct8')
import pefile
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
root=Path(__file__).resolve().parents[1]
pe=pefile.PE('C:/Program Files/GOG Galaxy/Games/Imperialism II/Imperialism II.exe')
md=Cs(CS_ARCH_X86,CS_MODE_32)
ranges=[(0x503e60,0x5042f0),(0x525d20,0x526030),(0x524330,0x5243c0),(0x526a20,0x526e60)]
if len(sys.argv)>1:ranges=[tuple(int(x,16) for x in arg.split(':')) for arg in sys.argv[1:]]
out=[]
for start,end in ranges:
 out.append(f'\n=== {start:x}-{end:x} ===')
 for i in md.disasm(pe.get_data(start-0x400000,end-start),start):out.append(f'{i.address:x}: {i.mnemonic} {i.op_str}')
(root/'work/diplomacy244-native.txt').write_text('\n'.join(out))
print('Wrote',len(out),'disassembly lines, read-only original executable')
