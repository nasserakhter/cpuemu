main:
  MOV R0, 5
loop:
  JZ end
  DEC R0
  JMP loop
end:
  INT 0
  NOP