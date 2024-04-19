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
import { getEventCountByDate } from "../../services/requests";
import { useGlobalState } from "../../services/state";
import { useRouter } from "next/navigation";

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

const page = () => {
  const [weekDays, setWeekDays] = useState({
    Segunda: { green: 0, yellow: 0, red: 0 },
    Terça: { green: 0, yellow: 0, red: 0 },
    Quarta: { green: 0, yellow: 0, red: 0 },
    Quinta: { green: 0, yellow: 0, red: 0 },
    Sexta: { green: 0, yellow: 0, red: 0 },
    Sábado: { green: 0, yellow: 0, red: 0 },
    Domingo: { green: 0, yellow: 0, red: 0 },
  });
  const router = useRouter();

  const {
    globalState: { champion },
  } = useGlobalState();

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
    <div className="p-32">
      <Bar options={options} data={data} />
    </div>
  );
};

export default page;
