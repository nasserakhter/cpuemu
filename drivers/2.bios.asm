start: 
  JMP main

handler:
  POP R5    ; get the return address
  PUSH R5   ; push it back on the stack
  CALL findFreeMemoryLocation
  MOV R6, 0x42494f53 ; Store the string "BIOS" in R6
  HLT

findFreeMemoryLocation:
  MOV R0, 0 ; Start at address 0
  JZ found
  INC R0    ; Increment the address
  MOV R1, [R0] ; Get the value at the address
found:
  RET

main:
  ADR handler   ; Get the address of the handler subroutine
  MOV [1], R0   ; Store the address of the handler in the interrupt table