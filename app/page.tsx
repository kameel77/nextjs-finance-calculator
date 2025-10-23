'use client';

import { Box, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";

import { ParameterForm } from "./components/parameter-form";
import { ResultsPanel } from "./components/results-panel";

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Image src="/logo.svg" alt="Logo" width={250} height={50} />
          <Stack alignItems={{ xs: 'center', md: 'flex-start' }}>
            <Typography component="h1" variant="h4" sx={{ textAlign: { xs: 'center', md: 'left' }, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              Dealer Car Financing Calculator
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: { xs: 'center', md: 'left' }, fontSize: { xs: '0.875rem', md: '1rem' } }}>
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
