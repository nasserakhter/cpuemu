start: 
  JMP main

handler:
  MOV R6, 0x42494f53 ; Store the string "BIOS" in R6
  HLT
main:
  ADR handler   ; Get the address of the handler subroutine
  MOV [1], R0   ; Store the address of the handler in the interrupt table