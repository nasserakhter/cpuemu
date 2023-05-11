; This library contains BIOS & OS-like functions
; such as malloc, etc.
%include drivers/bios/library

start:
  MOV R0, 12           ; Get 4 bytes of memory
  CALL malloc          ; Call the func
  MOV R1, R0
  MOV [R0], "H"
  INC R0
  MOV [R0], "E"
  INC R0
  MOV [R0], "L"
  INC R0
  MOV [R0], "L"
  INC R0
  MOV [R0], "O"
  INC R0
  MOV [R0], " "
  INC R0
  MOV [R0], "W"
  INC R0
  MOV [R0], "O"
  INC R0
  MOV [R0], "R"
  INC R0
  MOV [R0], "L"
  INC R0
  MOV [R0], "D"
  INC R0
  MOV [R0], 0x00

  MOV R0, R1
  CALL printstr
  HLT