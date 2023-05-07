start:
  MOV R0, 4            ; Get 4 bytes of memory
  CALL getFreeMemory   ; Call the func
  MOV R6, R0           ; Returns R0, R1, R2: start, end, map table
  MOV [R6], 15       ; Set the first byte to 0x15 
  MOV R0, 5
loop:
  JZ end
  DEC R0
  INC [R6]
  JMP loop
end:
  MOV R6, [R6]         ; 0x20
  HLT

; LIBRARY

; In:
; - R0: Size in bytes
; Out:
; - R0: Start address of the memory block
; - R1: End address of the memory block
; - R2: Map address in table
getFreeMemory:
  MOV R6, R5      ; Move all the registers over one, ignoring R6 (which is never used)
  MOV R5, R4
  MOV R4, R3
  MOV R3, R2
  MOV R2, R1
  MOV R1, R0    
  MOV R0, 0x00    ; Function 0x00: Get free memory
  INT 1           ; Call the BIOS
  MOV R0, [0x08]  ; Get the return values, which are stored in 0x08, 0x09, 0x0A, 0x0B
  MOV R1, [0x09]  ; In our case, R3, 0x0B, is not used
  MOV R2, [0x0A]
  MOV R3, [0x0B]
  RET