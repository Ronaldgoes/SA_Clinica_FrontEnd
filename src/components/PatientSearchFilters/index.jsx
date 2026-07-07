const PatientSearchFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalCount,
  filteredCount,
  title = 'Busca avançada',
}) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target
    onFilterChange(name, value)
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Filtre por nome, convênio, alergias, telefone ou identificador.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
          {filteredCount} de {totalCount} pacientes
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="block text-sm font-medium text-slate-700">
            Busca geral
          </span>
          <input
            type="text"
            name="query"
            value={filters.query}
            onChange={handleInputChange}
            placeholder="Nome, email ou registro"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-sm font-medium text-slate-700">
            Convênio
          </span>
          <input
            type="text"
            name="healthInsurance"
            value={filters.healthInsurance}
            onChange={handleInputChange}
            placeholder="Ex: Unimed"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-sm font-medium text-slate-700">
            Alergias
          </span>
          <input
            type="text"
            name="allergies"
            value={filters.allergies}
            onChange={handleInputChange}
            placeholder="Ex: dipirona"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-sm font-medium text-slate-700">
            Telefone
          </span>
          <input
            type="text"
            name="phone"
            value={filters.phone}
            onChange={handleInputChange}
            placeholder="(48) ..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Use os filtros avançados para localizar rapidamente pacientes com base
          em dados clínicos ou de contato.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Limpar filtros
        </button>
      </div>
    </section>
  )
}

export default PatientSearchFilters
