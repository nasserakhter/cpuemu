%include ../global

%define GPU_ARG_1 GPU_START + 1
; The chipset controller is attatched at 0x
printstr:
  ;MOV []
  MOV [[GPU_ARG_1]], R1
  MOV [[GPU_START]], [GPU_PRINT_STRING]
  IRET