start: 
  ADR handler
  MOV [1], R0
  HLT

; RAM starts at address 0x08
; first 4 bytes are reserved for global func params
; MAP starts at address 0x0C
; MAP has a size of 4 so it can store a maximum of 4 addresses
; Real memory starts at address 0x10
; The map address contains the last address of the memory block
%define RAM_START         0x08
%define RAM_SIZE          16
%define GLOBAL_ARGS_SIZE  4
%define MAP_SIZE          4

%define ARG_1             RAM_START

%define RAM_END           RAM_START + RAM_SIZE
%define MAP_START         RAM_START + GLOBAL_ARGS_SIZE

%define REAL_MEMORY_START MAP_START + MAP_SIZE
%define REAL_MEMORY_END   RAM_END


malloc:
  PUSH R1      ; Push the memory block size on the stack
  MOV R0, 4    ; Add 3 to get the last address of the map
  MOV R1, [MAP_START] ; Map start
findFreeMapAddress_loop:
  JZ error_noFreeMemory
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
  SUB R0, [MAP_START]
  JZ foundMapAddress_first
  JMP foundMapAddress_other
foundMapAddress_first:
  ; Store the start address of memory (0x10) in the first map
  MOV R0, [REAL_MEMORY_START]
  POP R1        ; Get the memory block size
  ADD R1, R0    ; Add the memory block size to the start address
  MOV [R2], R1  ; Store the end address in the map
  ; Registers should look like
  ; R0 = memory start, R1 = map start, 
  JMP findFreeMapAddress_end
foundMapAddress_other:
  ; Store the start address of memory (0x10) in the first map
  ; R2 = current free map address
  ; R0 = get the previous map address
  MOV R0, R2
  DEC R0
  MOV R0, [R0]  ; Get the previous map address
  ;INC R0        ; Increment the previous map address
  POP R1        ; Get the memory block size
  ADD R1, R0    ; Add the memory block size to the start address
  MOV [R2], R1  ; Store the end address in the map
findFreeMapAddress_end:
  MOV [0x08], R0 ; Store the start address of the memory block
  MOV [0x09], R1 ; Store the end address
  MOV [0x0A], R2 ; Store the map address
  IRET

;
; SECOND FUNCTION
;
secondFunc:
  MOV R6, 1497454937
  HLT

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
  JZ secondFunc
  JMP error_unknownInterruptSubfunction