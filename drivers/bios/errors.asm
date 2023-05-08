; Error codes
; 0xEExx: BIOS level error
; 0xEE02: Unknown interrupt subfunction
; 0xEE08: No free memory
error_unknownInterruptSubfunction:
  MOV R6, 0xEE02
  HLT
error_noFreeMemory:
  MOV R6, 0xEE08
  HLT