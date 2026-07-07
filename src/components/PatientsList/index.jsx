import { useState, useEffect } from "react"
import axios from "axios"
import { FaUserAlt } from 'react-icons/fa'
import { Link } from "react-router"
import PatientSearchFilters from "../PatientSearchFilters"

const PatientsList = () => {
    const [patients, setPatients] = useState([])
    const [ages, setAges] = useState({})
    const [filters, setFilters] = useState({
        query: "",
        healthInsurance: "",
        allergies: "",
        phone: "",
    })

    const calculateAge = (birthdate) => {
        if (!birthdate) return "-"
        const today = new Date()
        const birthdateDate = new Date(birthdate)
        let age = today.getFullYear() - birthdateDate.getFullYear()
        const monthDiff = today.getMonth() - birthdateDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateDate.getDate())) {
            age--
        }
        return age
    }

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get("http://localhost:3000/patients")
                if (!response) return

                const patientsData = response.data
                const calculatedAges = {}

                patientsData.forEach((patient) => {
                    calculatedAges[patient.id] = calculateAge(patient.birthdate)
                })

                setAges(calculatedAges)
                setPatients(patientsData)
            } catch (error) {
                console.error("Erro ao obter os dados de paciente", error)
            }
        }
        fetchPatients()
    }, [])

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

    const normalize = (value) => String(value ?? "").toLowerCase()

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
        <div className="space-y-6 mt-8">
            <PatientSearchFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                totalCount={patients.length}
                filteredCount={filteredPatients.length}
                title="Informações Rápidas de Pacientes"
            />

            {/* Lista de pacientes */}

            {
                filteredPatients.length > 0 ? (
                    <ul className="divide-y divide-gray-200 bg-white shadow rounded-2xl p-6">
                        {
                            filteredPatients.map((patient) => (
                                <li
                                    key={patient.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-cyan-100 text-cyan-700 p-3 rounded-full">
                                            <FaUserAlt size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{patient.fullName}</p>
                                            <p className="text-sm text-gray-600">{patient.email}</p>
                                            <p className="text-sm text-gray-600">{patient.phone}</p>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 mt-2 sm:mt-0 text-right">
                                        <p><strong>Idade:</strong>{ages[patient.id] || "-"} anos</p>
                                        <p><strong>Plano:</strong>{patient.healthInsurance || "-"}</p>
                                        <Link
                                            to={`/paciente/${patient.id}`}
                                            className="text-cyan-700 font-semibold hover:underline"
                                        >
                                            Ver detalhes
                                        </Link>
                                    </div>

                                </li>
                            ))

                        }
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-6 bg-white rounded-2xl shadow">
                        Nenhum paciente encontrado
                    </p>
                )
            }

        </div>
    )
}

export default PatientsList
