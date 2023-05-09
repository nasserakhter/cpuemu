%include bios/errors
%include bios/malloc
%include gpu/printchar
%include gpu/printstr

start:
  ADR handler
  MOV [1], R0
  HLT

; Handler for the interrupt
; In:
; - R0: The BIOS function to call
; In (for events):
; - R1: Custom arg 1
; - R2: Custom arg 2
; ...
; - R6: Custom arg 6
handler:
  ; Mappings for R0's value to handlers
  ; If R0 is 0 then jump to handler 0
  JZ malloc
  ; If R0 is 1 then decrement, and jump to handler 1
  DEC R0
  JZ printchar
  DEC R0
  JZ printstr
  JMP error_unknownInterruptSubfunction