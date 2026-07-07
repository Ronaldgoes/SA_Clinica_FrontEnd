import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router'
import { toast } from 'react-toastify'

const API_URL = 'http://localhost:3000'

const createEmptyConsultForm = () => ({
  reason: '',
  date: '',
  time: '',
  description: '',
  medication: '',
  dosagePrecautions: '',
})

const createEmptyExamForm = () => ({
  name: '',
  date: '',
  time: '',
  type: '',
  laboratory: '',
  documentUrl: '',
  results: '',
})

const consultFieldConfig = {
  reason: { label: 'Motivo', type: 'text', required: true },
  date: { label: 'Data', type: 'date', required: true },
  time: { label: 'Hora', type: 'time', required: true },
  description: { label: 'Descrição', type: 'textarea', required: true },
  medication: { label: 'Medicação', type: 'text', required: true },
  dosagePrecautions: {
    label: 'Dosagem e precauções',
    type: 'textarea',
    required: true,
  },
}

const examFieldConfig = {
  name: { label: 'Nome', type: 'text', required: true },
  date: { label: 'Data', type: 'date', required: true },
  time: { label: 'Hora', type: 'time', required: true },
  type: { label: 'Tipo', type: 'text', required: true },
  laboratory: { label: 'Laboratório', type: 'text', required: true },
  documentUrl: { label: 'URL do documento', type: 'url', required: false },
  results: { label: 'Resultados', type: 'textarea', required: true },
}

const patientFieldConfig = {
  fullName: { label: 'Nome completo' },
  healthInsurance: { label: 'Convênio' },
  phone: { label: 'Telefone' },
  birthdate: { label: 'Data de nascimento' },
  email: { label: 'E-mail' },
  gender: { label: 'Gênero' },
  maritalStatus: { label: 'Estado civil' },
  cpf: { label: 'CPF' },
  rg: { label: 'RG' },
  birthplace: { label: 'Naturalidade' },
  emergencyContact: { label: 'Contato de emergência' },
  allergies: { label: 'Alergias' },
  specialCare: { label: 'Cuidados especiais' },
  insuranceNumber: { label: 'Número do convênio' },
  insuranceValidity: { label: 'Validade do convênio' },
}

const addressFieldConfig = {
  cep: { label: 'CEP' },
  street: { label: 'Rua' },
  number: { label: 'Número' },
  complement: { label: 'Complemento' },
  neighborhood: { label: 'Bairro' },
  city: { label: 'Cidade' },
  state: { label: 'Estado' },
  reference: { label: 'Referência' },
}

const formatDateForInput = (value) => {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const dashMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dashMatch) {
    return `${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`
  }

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''

  return parsedDate.toISOString().split('T')[0]
}

const formatDateForDisplay = (value) => {
  const formatted = formatDateForInput(value)
  if (!formatted) return value || '-'

  const [year, month, day] = formatted.split('-')
  return `${day}/${month}/${year}`
}

const parseDateTimestamp = (value) => {
  const normalized = formatDateForInput(value)
  if (!normalized) return 0

  const parsedDate = new Date(`${normalized}T00:00:00`)
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
}

const sortRecordsByDate = (items, order = 'desc') => {
  return [...items].sort((leftRecord, rightRecord) => {
    const leftDate = parseDateTimestamp(leftRecord.date)
    const rightDate = parseDateTimestamp(rightRecord.date)

    if (order === 'asc') {
      return leftDate - rightDate
    }

    return rightDate - leftDate
  })
}

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (key === 'date' || key === 'birthdate' || key === 'insuranceValidity') {
    return formatDateForDisplay(value)
  }

  return value
}

const getRequiredFieldLabel = (formData, fieldConfig) => {
  const missingKey = Object.keys(formData).find((key) => {
    const field = fieldConfig[key]
    return field?.required && !String(formData[key] ?? '').trim()
  })

  return missingKey ? fieldConfig[missingKey].label : ''
}

const isValidUrl = (value) => {
  if (!value) return true

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const EditableField = ({
  name,
  label,
  type,
  value,
  onChange,
  required,
  disabled,
}) => {
  const baseInputClasses =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-100'

  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          rows={4}
          className={`${baseInputClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      )}
    </label>
  )
}

const PatientDetails = () => {
  const { id } = useParams()

  const [patient, setPatient] = useState(null)
  const [consults, setConsults] = useState([])
  const [exams, setExams] = useState([])

  const [editingConsult, setEditingConsult] = useState(null)
  const [consultFormData, setConsultFormData] = useState(createEmptyConsultForm())
  const [isConsultEditing, setIsConsultEditing] = useState(false)

  const [editingExam, setEditingExam] = useState(null)
  const [examFormData, setExamFormData] = useState(createEmptyExamForm())
  const [isExamEditing, setIsExamEditing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMutating, setIsMutating] = useState(false)
  const [consultSortOrder, setConsultSortOrder] = useState('desc')
  const [examSortOrder, setExamSortOrder] = useState('desc')

  const resetConsultEditState = useCallback(() => {
    setEditingConsult(null)
    setConsultFormData(createEmptyConsultForm())
    setIsConsultEditing(false)
  }, [])

  const resetExamEditState = useCallback(() => {
    setEditingExam(null)
    setExamFormData(createEmptyExamForm())
    setIsExamEditing(false)
  }, [])

  const loadPatientDetails = useCallback(
    async (signal) => {
      setLoading(true)
      setError('')
      resetConsultEditState()
      resetExamEditState()
      setPatient(null)
      setConsults([])
      setExams([])

      try {
        const patientResponse = await axios.get(`${API_URL}/patients/${id}`, {
          signal,
        })

        setPatient(patientResponse.data)

        const [consultsResult, examsResult] = await Promise.allSettled([
          axios.get(`${API_URL}/consults`, {
            params: { patientId: id },
            signal,
          }),
          axios.get(`${API_URL}/exams`, {
            params: { patientId: id },
            signal,
          }),
        ])

        if (consultsResult.status === 'fulfilled') {
          setConsults(consultsResult.value.data)
        } else {
          setConsults([])
          setError('Não foi possível carregar o histórico de consultas.')
        }

        if (examsResult.status === 'fulfilled') {
          setExams(examsResult.value.data)
        } else {
          setExams([])
          setError((currentError) =>
            currentError
              ? `${currentError} Não foi possível carregar o histórico de exames.`
              : 'Não foi possível carregar o histórico de exames.',
          )
        }
      } catch (fetchError) {
        if (fetchError.code === 'ERR_CANCELED') {
          return
        }

        if (fetchError.response?.status === 404) {
          const notFoundMessage = 'Paciente não encontrado.'
          setError(notFoundMessage)
          toast.error(notFoundMessage, {
            autoClose: 2500,
            hideProgressBar: true,
          })
          return
        }

        const genericMessage = 'Erro ao carregar dados.'
        setError(genericMessage)
        toast.error(genericMessage, {
          autoClose: 2500,
          hideProgressBar: true,
        })
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [id, resetConsultEditState, resetExamEditState],
  )

  useEffect(() => {
    if (!id) return undefined

    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPatientDetails(controller.signal)

    return () => {
      controller.abort()
    }
  }, [id, loadPatientDetails])

  const handleConsultInputChange = (event) => {
    const { name, value } = event.target
    setConsultFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const handleExamInputChange = (event) => {
    const { name, value } = event.target
    setExamFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const startConsultEdit = (consult) => {
    setEditingExam(null)
    setIsExamEditing(false)
    setEditingConsult(consult)
    setConsultFormData({
      reason: consult.reason ?? '',
      date: formatDateForInput(consult.date),
      time: consult.time ?? '',
      description: consult.description ?? '',
      medication: consult.medication ?? '',
      dosagePrecautions: consult.dosagePrecautions ?? '',
    })
    setIsConsultEditing(true)
  }

  const startExamEdit = (exam) => {
    setEditingConsult(null)
    setIsConsultEditing(false)
    setEditingExam(exam)
    setExamFormData({
      name: exam.name ?? '',
      date: formatDateForInput(exam.date),
      time: exam.time ?? '',
      type: exam.type ?? '',
      laboratory: exam.laboratory ?? '',
      documentUrl: exam.documentUrl ?? '',
      results: exam.results ?? '',
    })
    setIsExamEditing(true)
  }

  const handleSaveConsult = async (event) => {
    event.preventDefault()
    if (!editingConsult) return

    const missingField = getRequiredFieldLabel(consultFormData, consultFieldConfig)
    if (missingField) {
      toast.error(`Preencha o campo ${missingField.toLowerCase()}.`, {
        autoClose: 2500,
        hideProgressBar: true,
      })
      return
    }

    setIsMutating(true)

    try {
      const consultId = editingConsult.id
      const payload = {
        ...editingConsult,
        ...consultFormData,
        patientId: id,
      }

      const response = await axios.put(`${API_URL}/consults/${consultId}`, payload)

      setConsults((currentConsults) =>
        currentConsults.map((consult) =>
          consult.id === consultId ? response.data : consult,
        ),
      )

      toast.success('Consulta atualizada com sucesso.', {
        autoClose: 2500,
        hideProgressBar: true,
      })

      resetConsultEditState()
    } catch {
      toast.error('Erro ao atualizar a consulta.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } finally {
      setIsMutating(false)
    }
  }

  const handleSaveExam = async (event) => {
    event.preventDefault()
    if (!editingExam) return

    const missingField = getRequiredFieldLabel(examFormData, examFieldConfig)
    if (missingField) {
      toast.error(`Preencha o campo ${missingField.toLowerCase()}.`, {
        autoClose: 2500,
        hideProgressBar: true,
      })
      return
    }

    if (!isValidUrl(examFormData.documentUrl)) {
      toast.error('Informe uma URL válida para o documento.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
      return
    }

    setIsMutating(true)

    try {
      const examId = editingExam.id
      const payload = {
        ...editingExam,
        ...examFormData,
        patientId: id,
      }

      const response = await axios.put(`${API_URL}/exams/${examId}`, payload)

      setExams((currentExams) =>
        currentExams.map((exam) => (exam.id === examId ? response.data : exam)),
      )

      toast.success('Exame atualizado com sucesso.', {
        autoClose: 2500,
        hideProgressBar: true,
      })

      resetExamEditState()
    } catch {
      toast.error('Erro ao atualizar o exame.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteConsult = async (consultId) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta consulta?',
    )

    if (!confirmed) return

    setIsMutating(true)

    try {
      await axios.delete(`${API_URL}/consults/${consultId}`)
      setConsults((currentConsults) =>
        currentConsults.filter((consult) => consult.id !== consultId),
      )

      if (editingConsult?.id === consultId) {
        resetConsultEditState()
      }

      toast.success('Consulta excluída com sucesso.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } catch {
      toast.error('Erro ao excluir a consulta.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteExam = async (examId) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este exame?')

    if (!confirmed) return

    setIsMutating(true)

    try {
      await axios.delete(`${API_URL}/exams/${examId}`)
      setExams((currentExams) =>
        currentExams.filter((exam) => exam.id !== examId),
      )

      if (editingExam?.id === examId) {
        resetExamEditState()
      }

      toast.success('Exame excluído com sucesso.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } catch {
      toast.error('Erro ao excluir o exame.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } finally {
      setIsMutating(false)
    }
  }

  const sortedConsults = useMemo(
    () => sortRecordsByDate(consults, consultSortOrder),
    [consults, consultSortOrder],
  )

  const sortedExams = useMemo(
    () => sortRecordsByDate(exams, examSortOrder),
    [exams, examSortOrder],
  )

  const buildSummaryText = () => {
    const recentConsults = sortedConsults.slice(0, 3)
    const recentExams = sortedExams.slice(0, 3)

    const summarySections = [
      `Resumo do prontuário - ${patient?.fullName || 'Paciente'}`,
      `Registro: ${patient?.id || '-'}`,
      `Convênio: ${patient?.healthInsurance || '-'}`,
      `Telefone: ${patient?.phone || '-'}`,
      `E-mail: ${patient?.email || '-'}`,
      `Nascimento: ${formatDateForDisplay(patient?.birthdate)}`,
      '',
      `Consultas (${sortedConsults.length}):`,
      recentConsults.length > 0
        ? recentConsults
            .map(
              (consult) =>
                `- ${consult.reason || 'Consulta'} em ${formatDateForDisplay(consult.date)} às ${consult.time || '--:--'}`,
            )
            .join('\n')
        : '- Nenhuma consulta cadastrada',
      '',
      `Exames (${sortedExams.length}):`,
      recentExams.length > 0
        ? recentExams
            .map(
              (exam) =>
                `- ${exam.name || 'Exame'} em ${formatDateForDisplay(exam.date)} às ${exam.time || '--:--'}`,
            )
            .join('\n')
        : '- Nenhum exame cadastrado',
    ]

    return summarySections.join('\n')
  }

  const handleExportSummary = async () => {
    if (!patient) return

    const summaryText = buildSummaryText()

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Resumo de ${patient.fullName || 'Paciente'}`,
          text: summaryText,
        })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText)
      } else {
        throw new Error('Compartilhamento indisponível')
      }

      toast.success('Resumo do prontuário pronto para compartilhamento.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    } catch {
      toast.error('Não foi possível exportar o resumo do prontuário.', {
        autoClose: 2500,
        hideProgressBar: true,
      })
    }
  }

  const renderSummaryCard = (label, value, valueKey = '', isUrl = false) => {
    if (isUrl && value) {
      return (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
            {label}
          </p>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all text-sm font-medium text-cyan-900 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-700"
          >
            {value}
          </a>
        </div>
      )
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {formatValue(valueKey, value)}
        </p>
      </div>
    )
  }

  const renderFormFields = (formData, fieldConfig, onChange, disabled) =>
    Object.keys(formData).map((fieldName) => {
      const field = fieldConfig[fieldName]

      if (!field) return null

      const fieldWrapperClass =
        field.type === 'textarea' || fieldName === 'documentUrl'
          ? 'md:col-span-2'
          : ''

      return (
        <div key={fieldName} className={fieldWrapperClass}>
          <EditableField
            name={fieldName}
            label={field.label}
            type={field.type}
            value={formData[fieldName]}
            onChange={onChange}
            required={field.required}
            disabled={disabled}
          />
        </div>
      )
    })

  const renderPatientSection = () => {
    if (!patient) return null

    return (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-slate-50 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Prontuário do paciente
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {patient.fullName || 'Paciente sem nome'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Registro {patient.id}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleExportSummary}
                className="inline-flex items-center justify-center rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                Exportar resumo
              </button>

              <Link
                to="/prontuarios"
                className="inline-flex items-center justify-center rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                Voltar para prontuários
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Convênio', key: 'healthInsurance', value: patient.healthInsurance },
              { label: 'Telefone', key: 'phone', value: patient.phone },
              { label: 'Data de nascimento', key: 'birthdate', value: patient.birthdate },
              { label: 'E-mail', key: 'email', value: patient.email },
            ].map(({ label, key, value }) =>
              renderSummaryCard(label, value, key),
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.keys(patientFieldConfig).map((fieldName) =>
              renderSummaryCard(
                patientFieldConfig[fieldName].label,
                patient[fieldName],
                fieldName,
              ),
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Endereço</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Object.keys(addressFieldConfig).map((fieldName) =>
                renderSummaryCard(
                  addressFieldConfig[fieldName].label,
                  patient.address?.[fieldName],
                  fieldName,
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderHistorySection = ({
    title,
    description,
    items,
    emptyMessage,
    isEditing,
    editingItem,
    formData,
    fieldConfig,
    onEdit,
    onChange,
    onSave,
    onCancel,
    onDelete,
    loadingButtonLabel,
    saveButtonLabel,
    cancelButtonLabel,
    sortOrder,
    onToggleSortOrder,
    sectionTone = 'cyan',
  }) => {
    const toneClasses =
      sectionTone === 'cyan'
        ? 'border-cyan-200 bg-cyan-50/60 text-cyan-900'
        : 'border-amber-200 bg-amber-50/70 text-amber-900'

    return (
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses}`}
            >
              {items.length} registros
            </span>
            <button
              type="button"
              onClick={onToggleSortOrder}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            items.map((item) => {
              const itemIsEditing = isEditing && editingItem?.id === item.id

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                        {item.id}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.reason || item.name || 'Registro sem título'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {formatDateForDisplay(item.date)} às {item.time || '--:--'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        disabled={isMutating || itemIsEditing}
                        className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        disabled={isMutating}
                        className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {!itemIsEditing ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Object.keys(fieldConfig).map((fieldName) => {
                        const field = fieldConfig[fieldName]

                        return renderSummaryCard(
                          field.label,
                          item[fieldName],
                          fieldName,
                          field.type === 'url',
                        )
                      })}
                    </div>
                  ) : (
                    <form onSubmit={onSave} className="mt-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderFormFields(
                          formData,
                          fieldConfig,
                          onChange,
                          isMutating,
                        )}
                      </div>

                      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={onCancel}
                          disabled={isMutating}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancelButtonLabel}
                        </button>

                        <button
                          type="submit"
                          disabled={isMutating}
                          className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isMutating ? loadingButtonLabel : saveButtonLabel}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              )
            })
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Detalhes do paciente
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Histórico clínico e registros
          </h2>
        </div>

        <Link
          to="/prontuarios"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800"
        >
          Voltar
        </Link>
      </div>

      {loading ? (
        <div
          className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-slate-900">
            Carregando dados do paciente...
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Estamos buscando o prontuário, consultas e exames.
          </p>
        </div>
      ) : (
        <>
          {error ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                error === 'Paciente não encontrado.'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {error}
            </div>
          ) : null}

          {patient ? renderPatientSection() : null}

          {patient ? (
            <div className="grid gap-6">
              {renderHistorySection({
                title: 'Histórico de Consultas',
                description:
                  'Consulte, edite, atualize ou exclua os atendimentos deste paciente.',
                items: sortedConsults,
                emptyMessage: 'Nenhuma consulta encontrada para este paciente.',
                isEditing: isConsultEditing,
                editingItem: editingConsult,
                formData: consultFormData,
                fieldConfig: consultFieldConfig,
                onEdit: startConsultEdit,
                onChange: handleConsultInputChange,
                onSave: handleSaveConsult,
                onCancel: resetConsultEditState,
                onDelete: handleDeleteConsult,
                loadingButtonLabel: 'Salvando consulta...',
                saveButtonLabel: 'Salvar consulta',
                cancelButtonLabel: 'Cancelar',
                sortOrder: consultSortOrder,
                onToggleSortOrder: () =>
                  setConsultSortOrder((currentOrder) =>
                    currentOrder === 'desc' ? 'asc' : 'desc',
                  ),
                sectionTone: 'cyan',
              })}

              {renderHistorySection({
                title: 'Histórico de Exames',
                description:
                  'Gerencie os exames associados ao paciente com atualização imediata.',
                items: sortedExams,
                emptyMessage: 'Nenhum exame encontrado para este paciente.',
                isEditing: isExamEditing,
                editingItem: editingExam,
                formData: examFormData,
                fieldConfig: examFieldConfig,
                onEdit: startExamEdit,
                onChange: handleExamInputChange,
                onSave: handleSaveExam,
                onCancel: resetExamEditState,
                onDelete: handleDeleteExam,
                loadingButtonLabel: 'Salvando exame...',
                saveButtonLabel: 'Salvar exame',
                cancelButtonLabel: 'Cancelar',
                sortOrder: examSortOrder,
                onToggleSortOrder: () =>
                  setExamSortOrder((currentOrder) =>
                    currentOrder === 'desc' ? 'asc' : 'desc',
                  ),
                sectionTone: 'amber',
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

export default PatientDetails
