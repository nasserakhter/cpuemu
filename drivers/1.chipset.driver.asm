%include chipset/errors
%include chipset/shutdown

start: 
  ADR handler
  MOV [0], R0
  HLT

; R0 will store the subfunction to call
handler:
  JZ shutdown
  DEC R0
  JMP error_unknownInterruptSubfunction