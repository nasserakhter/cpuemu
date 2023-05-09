; This library contains BIOS & OS-like functions
; such as malloc, etc.
%include drivers/bios/library

start:
  MOV R0, 12           ; Get 4 bytes of memory
  CALL malloc          ; Call the func
  MOV R1, R0
  MOV [R0], 0x48
  INC R0
  MOV [R0], 0x45
  INC R0
  MOV [R0], 0x4c
  INC R0
  MOV [R0], 0x4c
  INC R0
  MOV [R0], 0x4f
  INC R0
  MOV [R0], 0x20
  INC R0
  MOV [R0], 0x57
  INC R0
  MOV [R0], 0x4f
  INC R0
  MOV [R0], 0x52
  INC R0
  MOV [R0], 0x4c
  INC R0
  MOV [R0], 0x44
  INC R0
  MOV [R0], 0x00

  MOV R0, R1
  CALL printstr
  HLT