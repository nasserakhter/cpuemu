%include ../global

; The chipset controller is attatched at 0x
shutdown:
  ;MOV []
  MOV [[CHIPSET_START]], [CHIPSET_SHUTDOWN]
  IRET