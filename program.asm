  JMP main
; LIBRARY

; In:
; - R0: Size in bytes
; Out:
; - R0: Start address of the memory block
; - R1: End address of the memory block
; - R2: Map address in table
getFreeMemory:
  INT 1           ; Call the BIOS
  MOV R0, [0x08]
  MOV R1, [0x09]
  MOV R2, [0x0A]
  RET


main:
  MOV R0, 5
loop:
  JZ end
  DEC R0
  JMP loop
end:
  MOV R0, 4 ; The get free memory call uses R0 for the size in bytes
  CALL getFreeMemory
  MOV R6, R0
  HLT