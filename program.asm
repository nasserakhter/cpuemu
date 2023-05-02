main:
  MOV 15, R00
  MOV R00, R42
  SUB R00, 1
compute:
  JZ end
  MUL R42, R00 ; R42 is 90
  DEC R00
  JMP compute
end:
  NOP