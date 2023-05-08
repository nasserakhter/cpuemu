; This library contains BIOS & OS-like function
; such as malloc, etc.
%include drivers/bios/library

start:
  MOV R0, 4            ; Get 4 bytes of memory
  CALL malloc          ; Call the func
  MOV R0, 4            ; Get 'nother 4 bytes of memory
  CALL malloc          ; Call the func
  MOV R6, R0  ; Returns R0, R1, R2: start, end, map table
  HLT