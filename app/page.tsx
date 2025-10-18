'use client';

import { Box, Container, Stack, Typography } from "@mui/material";

import { ParameterForm } from "./components/parameter-form";
import { ResultsPanel } from "./components/results-panel";

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            Izzy Finance Calculator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Docelowy kalkulator finansowania samochodów dla doradców i klientów biznesowych.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" }
          }}
        >
          <ParameterForm />
          <ResultsPanel />
        </Box>
      </Stack>
    </Container>
  );
}
