//  REFATORAR

"use client";
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  getDailyActivitieById,
  getEventCountByDate,
} from "../../services/requests";
import { useGlobalState } from "../../services/state";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Quantidade de cada cor dos dias por dia da semana",
    },
  },
};

const labels = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

// const columns = [
//   { id: "name", label: "Data", minWidth: 170 },
//   { id: "code", label: "Horas Estudando", minWidth: 100 },
//   {
//     id: "population",
//     label: "Horas Lendo",
//     minWidth: 170,
//     align: "right",
//     format: (value) => value.toLocaleString("en-US"),
//   },
//   {
//     id: "size",
//     label: "Horas Meditando",
//     minWidth: 170,
//     align: "right",
//     format: (value) => value.toLocaleString("en-US"),
//   },
//   {
//     id: "density",
//     label: "Treino Membro Superior",
//     minWidth: 170,
//     align: "right",
//     format: (value) => value.toFixed(2),
//   },
// ];

const createColumns = (id, label, minWidth) => {
  return { id, label, minWidth };
};

const columns = [
  createColumns("date", "Data", 75),
  createColumns("study", "Hrs. Estudando", 75),
  createColumns("reading", "Hrs. Lendo", 75),
  createColumns("meditation", "Hrs. Meditando", 75),
  createColumns("upperLimb", "Treino Superior", 75),
  createColumns("lowerLimb", "Treino Inferior", 75),
  createColumns("abs", "Treino Abdominal", 75),
  createColumns("jumpRope", "Saltos de corda", 75),
  createColumns("kmBike", "Km Pedalados", 75),
  createColumns("kmRun", "Km Corridos", 75),
  createColumns("meals", "Refeições Saudáveis", 75),
  createColumns("drinks", "Litros de Água", 75),
  createColumns("sleep", "Hrs. de Sono", 75),
];

const createData = (activity) => {
  const {
    Data,
    "Horas Estudando": study,
    "Horas Lendo": reading,
    "Horas Meditando": meditation,
    "Treino Membro Superior": upperLimb,
    "Treino Membro Inferior": lowerLimb,
    "Treino Abdominal": abs,
    "Saltos de corda": jumpRope,
    "Km Pedalados": kmBike,
    "Km Corridos": kmRun,
    "Refeições Saudáveis": meals,
    "Litros de Água": drinks,
    "Horas de Sono": sleep,
  } = activity;

  return {
    date: Data,
    study,
    reading,
    meditation,
    upperLimb,
    lowerLimb,
    abs,
    jumpRope,
    kmBike,
    kmRun,
    meals,
    drinks,
    sleep,
  };
};

const page = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const [weekDays, setWeekDays] = useState({
    Segunda: { green: 0, yellow: 0, red: 0 },
    Terça: { green: 0, yellow: 0, red: 0 },
    Quarta: { green: 0, yellow: 0, red: 0 },
    Quinta: { green: 0, yellow: 0, red: 0 },
    Sexta: { green: 0, yellow: 0, red: 0 },
    Sábado: { green: 0, yellow: 0, red: 0 },
    Domingo: { green: 0, yellow: 0, red: 0 },
  });
  const [dailyActivities, setDailyActivities] = useState();

  const [showAnalitycs, setShowAnalitycs] = useState("daysWeek");

  const router = useRouter();

  const {
    globalState: { champion },
  } = useGlobalState();

  useEffect(() => {
    const callRows = () => {
      // Mapear os novos dados de atividades diárias e filtrar apenas aqueles que ainda não estão presentes em rows
      const newRows = dailyActivities.map((activity) => createData(activity));
      const uniqueRows = newRows.filter((newActivity) => {
        // Verificar se o novo objeto já está presente em rows
        return !rows.some(
          (existingActivity) =>
            JSON.stringify(existingActivity) === JSON.stringify(newActivity)
        );
      });

      // Atualizar rows adicionando os novos dados filtrados
      setRows([...rows, ...uniqueRows]);
    };

    dailyActivities && callRows();
  }, [dailyActivities]);

  useEffect(() => {
    const eventCount = async (id) => {
      const { events } = await getEventCountByDate(id);

      // Ajuste os nomes das chaves do objeto weekDays
      const adjustedWeekDays = {};
      Object.entries(events).forEach(([dia, cores]) => {
        const diaSemana = dia.replace(/-feira/g, "");
        adjustedWeekDays[
          diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
        ] = cores;
      });

      setWeekDays(adjustedWeekDays);

      const { activities } = await getDailyActivitieById(id);

      const adjustedDailyActivities = activities.map((activity) => {
        // Remover as chaves id e champion_id
        const { id, champion_id, ...rest } = activity;

        // Traduzir as chaves conforme necessário
        const translatedKeys = {
          date: "Data",
          study: "Horas Estudando",
          reading: "Horas Lendo",
          meditation: "Horas Meditando",
          upperLimb: "Treino Membro Superior",
          lowerLimb: "Treino Membro Inferior",
          abs: "Treino Abdominal",
          jumpRope: "Saltos de corda",
          kmBike: "Km Pedalados",
          kmRun: "Km Corridos",
          meals: "Refeições Saudáveis",
          drinks: "Litros de Água",
          sleep: "Horas de Sono",
        };

        // Mapear as chaves traduzidas e seus valores correspondentes
        const translatedActivity = {};
        for (const [key, value] of Object.entries(rest)) {
          if (translatedKeys[key]) {
            translatedActivity[translatedKeys[key]] = value || 0;
          }
        }

        return translatedActivity;
      });

      setDailyActivities(adjustedDailyActivities);
    };

    if (champion) {
      eventCount(champion.id);
    } else {
      router.push("/");
    }
  }, []);

  // Atualize esta função para criar os dados do gráfico com base nos valores em weekDays
  const createChartData = () => {
    return {
      labels,
      datasets: [
        {
          label: "Verde",
          data: labels.map((dia) => weekDays[dia]?.green || 0),
          backgroundColor: "#008000",
        },
        {
          label: "Amarelo",
          data: labels.map((dia) => weekDays[dia]?.yellow || 0),
          backgroundColor: "#FFFF00",
        },
        {
          label: "Vermelho",
          data: labels.map((dia) => weekDays[dia]?.red || 0),
          backgroundColor: "#FF0000",
        },
      ],
    };
  };

  const data = createChartData();

  return (
    <div>
      <div className="flex justify-center gap-4 p-5">
        <button
          className="btn-select-analitycs"
          onClick={() => setShowAnalitycs("daysWeek")}
        >
          Dias da semana
        </button>
        <button
          className="btn-select-analitycs"
          onClick={() => setShowAnalitycs("dailyActivities")}
        >
          Atividades diárias
        </button>
      </div>
      <div className="p-16">
        {showAnalitycs === "daysWeek" && <Bar options={options} data={data} />}
        {showAnalitycs === "dailyActivities" && (
          <Paper
            sx={{
              width: "100%",
              overflow: "hidden",
              backgroundColor: "rgb(24 24 27 / var(--tw-bg-opacity))",
            }}
          >
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{
                          minWidth: column.minWidth,
                          backgroundColor: "#000",
                          color: "#fff",
                          fontWeight: "900",
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={row.code}
                        >
                          {columns.map((column) => {
                            const value = row[column.id];
                            return (
                              <TableCell
                                key={column.id}
                                align={column.align}
                                style={{
                                  backgroundColor: "#333",
                                  color: "#fff",
                                }}
                              >
                                {column.format && typeof value === "number"
                                  ? column.format(value)
                                  : value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              style={{
                backgroundColor: "#333",
                color: "#fff",
              }}
            />
          </Paper>
        )}
      </div>
    </div>
  );
};

export default page;
