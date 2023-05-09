; Errors start with 0xEDxx
; 0xED02: Unknown interrupt subfunction
error_unknownInterruptSubfunction:
  MOV R0, 0xED02
  HLT