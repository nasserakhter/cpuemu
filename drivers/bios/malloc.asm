%include ../global
%include errors

malloc:
  PUSH R1      ; Push the memory block size on the stack
  MOV R0, [MAP_SIZE]    ; Add 3 to get the last address of the map
  MOV R1, [MAP_START] ; Map start
malloc_loop:
  JZ error_noFreeMemory
  MOV R2, R0
  MOV R0, [R1] ; Get the address from the map
  JZ malloc_found
  MOV R0, R2
  DEC R0       ; Decrement the counter
  INC R1       ; Increment the map address
  JMP malloc_loop

malloc_found:
  MOV R2, R1
  MOV R0, R1
  SUB R0, [MAP_START]
  JZ malloc_found_first
  JMP malloc_found_other

malloc_found_first:
  ; Store the start address of memory (0x10) in the first map
  MOV R0, [REAL_MEMORY_START]
  POP R1        ; Get the memory block size
  ADD R1, R0    ; Add the memory block size to the start address
  MOV [R2], R1  ; Store the end address in the map
  ; Registers should look like
  ; R0 = memory start, R1 = map start, 
  JMP malloc_end

malloc_found_other:
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

malloc_end:
  MOV [[ARG_1]], R0 ; Store the start address of the memory block
  MOV [[ARG_2]], R1 ; Store the end address
  MOV [[ARG_3]], R2 ; Store the map address
  IRET