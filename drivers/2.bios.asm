start: 
  JMP main

; RAM starts at address 0x08
; first 4 bytes are reserved for global func params
; MAP starts at address 0x0C
; MAP has a size of 4 so it can store a maximum of 4 addresses
; Real memory starts at address 0x10
; The map address contains the last address of the memory block
findFreeMapAddress:
  PUSH R0      ; Push the memory block size on the stack
  MOV R0, 4    ; Add 3 to get the last address of the map
  MOV R1, 0x0C ; Map start
findFreeMapAddress_loop:
  JZ noFreeMapAddress
  MOV R2, R0
  MOV R0, [R1] ; Get the address from the map
  JZ foundMapAddress
  MOV R0, R2
  DEC R0       ; Decrement the counter
  INC R1       ; Increment the map address
  JMP findFreeMapAddress_loop

foundMapAddress:
  MOV R2, R1
  MOV R0, R1
  SUB R0, 0x0C
  JZ foundMapAddress_first
  JMP foundMapAddress_other

foundMapAddress_first:
  ; Store the start address of memory (0x10) in the first map
  MOV R0, 0x10
  POP R1        ; Get the memory block size
  ADD R1, R0    ; Add the memory block size to the start address
  MOV [R2], R1  ; Store the end address in the map
  ; Registers should look like
  ; R0 = memory start, R1 = map start, 
  JMP end
   
foundMapAddress_other:
  ; Store the start address of memory (0x10) in the first map
  ; R2 = current free map address
  ; R0 = get the previous map address
  MOV R0, R2
  DEC R0
  MOV R0, [R0]  ; Get the previous map address
  INC R0        ; Increment the previous map address
  POP R1        ; Get the memory block size
  ADD R1, R0    ; Add the memory block size to the start address
  MOV [R2], R1  ; Store the end address in the map
  JMP end

noFreeMapAddress:
  MOV R6, 1163022930 ; Store the string "ERRR" in R6
  HLT

end:
  MOV [0x08], R0 ; Store the start address of the memory block
  MOV [0x09], R1 ; Store the end address
  MOV [0x0A], R2 ; Store the map address
  IRET

; Handler for the interrupt
; In:
; - R0: The BIOS function to call
handler:

main:
  ADR handler      ; Get the address of the handler subroutine
  MOV [1], R0      ; Store the address of the handler in the interrupt table