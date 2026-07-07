import { useState, useEffect } from "react"
import { Link } from "react-router"
import axios from "axios"
import PatientSearchFilters from "../PatientSearchFilters"

const MedicalRecordList = () => {
  const [patients, setPatients] = useState([])
  const [filters, setFilters] = useState({
    query: "",
    healthInsurance: "",
    allergies: "",
    phone: "",
  })

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get("http://localhost:3000/patients")
        setPatients(response.data)
      } catch (error) {
        console.error("Erro ao obter dados dos pacientes:", error)
      }
    }

    fetchPatients()
  }, [])

  const normalize = (value) => String(value ?? "").toLowerCase()

  const handleFilterChange = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      healthInsurance: "",
      allergies: "",
      phone: "",
    })
  }

  const filteredPatients = patients.filter((patient) => {
    const query = normalize(filters.query)
    const insurance = normalize(filters.healthInsurance)
    const allergies = normalize(filters.allergies)
    const phone = normalize(filters.phone)

    const matchesQuery =
      !query ||
      [patient.fullName, patient.email, patient.phone, patient.id]
        .join(" ")
        .toLowerCase()
        .includes(query)

    const matchesInsurance =
      !insurance || normalize(patient.healthInsurance).includes(insurance)

    const matchesAllergies =
      !allergies || normalize(patient.allergies).includes(allergies)

    const matchesPhone = !phone || normalize(patient.phone).includes(phone)

    return matchesQuery && matchesInsurance && matchesAllergies && matchesPhone
  })

  return (
    <section className="space-y-6 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Listagem de Prontuários
      </h2>

      <PatientSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        totalCount={patients.length}
        filteredCount={filteredPatients.length}
        title="Busca avançada de prontuários"
      />

      <ul className="space-y-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <li
              key={patient.id}
              className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-500">
                <strong className="text-gray-700">Registro:</strong> {patient.id}
              </p>
              <p className="text-gray-700">
                <strong>Nome:</strong> {patient.fullName}
              </p>
              <p className="text-gray-700">
                <strong>Convênio:</strong> {patient.healthInsurance}
              </p>
              <p className="text-gray-700">
                <strong>Alergias:</strong> {patient.allergies || "-"}
              </p>
              <p className="text-gray-700">
                <strong>Telefone:</strong> {patient.phone || "-"}
              </p>
              <Link
                to={`/paciente/${patient.id}`}
                className="inline-block mt-2 text-cyan-700 font-semibold hover:underline"
              >
                Ver detalhes
              </Link>
            </li>
          ))
        ) : (
          <p className="text-gray-600">Nenhum paciente encontrado.</p>
        )}
      </ul>
    </section>
  )
}

export default MedicalRecordList
