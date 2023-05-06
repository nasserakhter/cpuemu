start: 
  JMP main

handler:
  MOV R6, 1128810832
  RTI


main:
  ADR handler   ; Get the address of the handler subroutine
  MOV [0], R0   ; Store the address of the handler in the interrupt table