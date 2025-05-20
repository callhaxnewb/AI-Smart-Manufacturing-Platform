import { Bar } from "react-chartjs-2";

export function BarChart({ data, title }) {
  const chartData = {
    labels: data.map(d => d._id),
    datasets: [
      {
        label: 'Count',
        data: data.map(d => d.count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
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

  return <Bar data={chartData} options={options} />;
}