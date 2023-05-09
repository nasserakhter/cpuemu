%include ../utils

; LIBRARY

; In:
; - R0: Size in bytes
; Out:
; - R0: Start address of the memory block
; - R1: End address of the memory block
; - R2: Map address in table
malloc:
  CALL shiftreg_up   
  MOV R0, 0x00    ; Function 0x00: Get free memory
  INT 0x01        ; Call the BIOS
  CALL pullargs
  RET

; In:
; - R0: Character to print
; Out:
; Nothing
printchar:
  CALL backupreg
  CALL shiftreg_up
  MOV R0, 0x01    ; Function 0x01: Print character
  INT 0x01        ; Call the BIOS
  CALL restorereg
  ; CALL pullargs
  RET

; In:
; - R0: Memory address to null terminated string
; Out:
; Nothing
printstr:
  CALL backupreg
  CALL shiftreg_up
  MOV R0, 0x02    ; Function 0x01: Print character
  INT 0x01        ; Call the BIOS
  CALL restorereg
  ; CALL pullargs
  RET