start: 
  ADR handler
  MOV [0], R0
  HLT

; The chipset controller is attatched at 0x
shutdown:
  MOV []
  HLT
; Errors start with 0xEDxx
; 0xED02: Unknown interrupt subfunction
error_unknownInterruptSubfunction:
  MOV R0, 0xED02
  HLT

; R0 will store the subfunction to call
handler:
  MOV R6, 1128810832
  IRET