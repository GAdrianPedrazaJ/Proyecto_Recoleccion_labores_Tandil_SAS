import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { putFormulario, putConfig } from '../services/db'
import { createId, emptyLabores, todayIsoDate } from '../utils/helpers'
import type { FormularioDia, RegistroColaborador } from '../types'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'

const dias = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
] as const

const tipos = ['Labores', 'Corte', 'Vegetativa'] as const

const schema = z.object({
  fecha: z.string().min(1, 'Requerido'),
  supervisor: z.string().min(1, 'Requerido'),
  sede: z.string().min(1, 'Requerido'),
  dia: z.enum(dias),
  tipo: z.enum(tipos),
})

type FormValues = z.infer<typeof schema>

/** Formulario cabecera del día; colaboradores se agregarán en pasos siguientes. */
export function NuevoRegistro() {
  const navigate = useNavigate()
  const setSupervisor = useAppStore((s) => s.setSupervisor)
  const setSede = useAppStore((s) => s.setSede)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: todayIsoDate(),
      dia: 'Lunes',
      tipo: 'Labores',
      supervisor: '',
      sede: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setSupervisor(values.supervisor)
    setSede(values.sede)
    await putConfig({
      id: 'default',
      supervisor: values.supervisor,
      sede: values.sede,
    })

    const colaboradorEjemplo: RegistroColaborador = {
      id: createId('col'),
      numeroColaborador: 1,
      nombreColaborador: 'Pendiente de carga',
      externo: false,
      variedad: '',
      tallosEstimados: 0,
      tallosReales: 0,
      horaInicio: new Date().toTimeString().slice(0, 5),
      labores: emptyLabores(),
      proceso: true,
      seguridad: true,
      calidad: true,
      cumplimiento: true,
      compromiso: true,
      observaciones: '',
      tiempoEjecucion: 0,
    }

    const nuevo: FormularioDia = {
      id: createId('form'),
      fecha: values.fecha,
      supervisor: values.supervisor,
      sede: values.sede,
      dia: values.dia,
      tipo: values.tipo,
      colaboradores: [colaboradorEjemplo],
      sincronizado: false,
      fechaCreacion: new Date().toISOString(),
      intentosSincronizacion: 0,
    }
    await putFormulario(nuevo)
    window.dispatchEvent(new CustomEvent('labores:sync'))
    navigate('/pendientes')
  }

  return (
    <div className="px-4 py-4">
      <form className="mx-auto flex max-w-lg flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-gray-600">
          Completa la cabecera del día. Luego podrás editar colaboradores y labores en pantallas
          dedicadas.
        </p>
        <Input label="Fecha" type="date" {...register('fecha')} error={errors.fecha?.message} />
        <Input
          label="Supervisor"
          {...register('supervisor')}
          error={errors.supervisor?.message}
        />
        <Input label="Sede" {...register('sede')} error={errors.sede?.message} />
        <Select label="Día" {...register('dia')} error={errors.dia?.message}>
          {dias.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select label="Tipo" {...register('tipo')} error={errors.tipo?.message}>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Button type="submit">Guardar borrador local</Button>
      </form>
    </div>
  )
}
