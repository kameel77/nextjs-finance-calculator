'use client';

import { Box, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";

import { ParameterForm } from "./components/parameter-form";
import { ResultsPanel } from "./components/results-panel";

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Image src="/logo.svg" alt="Logo" width={300} height={70} />
          <Stack>
            <Typography component="h1" variant="h4">
              Dealer Car Financing Calculator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Kalkulator finansowania samochodów dla doradców i klientów
              biznesowych.
            </Typography>
          </Stack>
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
