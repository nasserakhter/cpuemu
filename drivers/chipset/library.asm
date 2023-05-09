%include ../utils

shutdown:
  ;MOV []
  CALL shiftreg_up
  MOV R0, 0x00      ; The shutdown function
  INT 0
  CALL pullargs
  RET