%include global

shiftreg_up:
  MOV R6, R5      ; Move all the registers over one, ignoring R6 (which is never used)
  MOV R5, R4
  MOV R4, R3
  MOV R3, R2
  MOV R2, R1
  MOV R1, R0
  RET

pullargs:
  MOV R0, [[ARG_1]]  ; Get the return values, which are stored in 0x08, 0x09, 0x0A, 0x0B
  MOV R1, [[ARG_2]]  ; In our case, R3, 0x0B, is not used
  MOV R2, [[ARG_3]]
  MOV R3, [[ARG_4]]  ; One parenthesis for variable, one for addressing
  RET

backupreg:
  POP [[ARG_1]]
  PUSH R0
  PUSH R1
  PUSH R2
  PUSH R3
  PUSH R4
  PUSH R5
  PUSH R6
  PUSH [[ARG_1]]
  RET

restorereg:
  POP [[ARG_1]]
  POP R6
  POP R5
  POP R4
  POP R3
  POP R2
  POP R1
  POP R0
  PUSH [[ARG_1]]
  RET