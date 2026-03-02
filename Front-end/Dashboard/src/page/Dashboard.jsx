import React from "react";
import Card from "../components/Card";
import Chart from "../components/Chart";
export default function Dashboard() {
    return (
        <div className="md:ml-64 p-6 md:p-10 mt-16 md:mt-0">
            {/* Cards */}
            <Card />

            {/* Chart */}
            <Chart />
        </div>
    );
}
