import { Line } from "react-chartjs-2";

export function LineChart({ data, title, dataKey, label }) {
  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label,
        data: data.map(d => d[dataKey]),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      y: { beginAtZero: true },
    },
    plugins: {
      title: { display: true, text: title },
    },
  };

  return <Line data={chartData} options={options} />;
}