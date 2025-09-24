import { render, screen } from '@testing-library/react';
import { ScoreIndicator, ScoreProgress, RankingBadge } from './score-indicator';

// Mock framer-motion pour éviter les erreurs dans les tests
jest.mock('framer-motion', () => ({
  motion: {
    span: 'span',
    div: 'div',
  },
}));

// Mock du module utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock du composant Badge
jest.mock('./badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

// Mock des icônes Lucide React
jest.mock('lucide-react', () => ({
  TrendingUp: ({ className }: any) => <span data-testid="trending-up" className={className} />,
  TrendingDown: ({ className }: any) => <span data-testid="trending-down" className={className} />,
  Minus: ({ className }: any) => <span data-testid="minus" className={className} />,
}));

describe('ScoreIndicator', () => {
  describe('Score Parsing and Display', () => {
    it('should display valid numeric score', () => {
      render(<ScoreIndicator score={85.5} />);

      expect(screen.getByText('85.5')).toBeInTheDocument();
    });

    it('should parse string score correctly', () => {
      render(<ScoreIndicator score="92.3" />);

      expect(screen.getByText('92.3')).toBeInTheDocument();
    });

    it('should handle null/undefined scores', () => {
      const { rerender } = render(<ScoreIndicator score={null} />);
      expect(screen.getByText('0.0')).toBeInTheDocument();

      rerender(<ScoreIndicator score={undefined} />);
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle invalid string scores', () => {
      render(<ScoreIndicator score="invalid" />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle NaN scores', () => {
      render(<ScoreIndicator score={NaN} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle negative scores', () => {
      render(<ScoreIndicator score={-15.5} />);

      expect(screen.getByText('-15.5')).toBeInTheDocument();
    });

    it('should handle zero score', () => {
      render(<ScoreIndicator score={0} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });
  });

  describe('Score Color Classification', () => {
    it('should apply green color for excellent scores (>=80)', () => {
      const { container } = render(<ScoreIndicator score={85} />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('should apply blue color for good scores (60-79)', () => {
      const { container } = render(<ScoreIndicator score={70} />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('should apply yellow color for average scores (40-59)', () => {
      const { container } = render(<ScoreIndicator score={50} />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-yellow-600', 'dark:text-yellow-400');
    });

    it('should apply red color for poor scores (<40)', () => {
      const { container } = render(<ScoreIndicator score={25} />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-red-600', 'dark:text-red-400');
    });

    it('should handle boundary values correctly', () => {
      const { container, rerender } = render(<ScoreIndicator score={80} />);
      expect(container.querySelector('span')).toHaveClass('text-green-600');

      rerender(<ScoreIndicator score={79.9} />);
      expect(container.querySelector('span')).toHaveClass('text-blue-600');

      rerender(<ScoreIndicator score={60} />);
      expect(container.querySelector('span')).toHaveClass('text-blue-600');

      rerender(<ScoreIndicator score={59.9} />);
      expect(container.querySelector('span')).toHaveClass('text-yellow-600');

      rerender(<ScoreIndicator score={40} />);
      expect(container.querySelector('span')).toHaveClass('text-yellow-600');

      rerender(<ScoreIndicator score={39.9} />);
      expect(container.querySelector('span')).toHaveClass('text-red-600');
    });
  });

  describe('Size Variations', () => {
    it('should apply small size class', () => {
      const { container } = render(<ScoreIndicator score={75} size="sm" />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-sm');
    });

    it('should apply medium size class by default', () => {
      const { container } = render(<ScoreIndicator score={75} />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-base');
    });

    it('should apply large size class', () => {
      const { container } = render(<ScoreIndicator score={75} size="lg" />);

      const scoreElement = container.querySelector('span');
      expect(scoreElement).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('Trend Display', () => {
    it('should show upward trend when score increases', () => {
      render(<ScoreIndicator score={85} previousScore={75} />);

      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
      expect(screen.getByText('10.0')).toBeInTheDocument();
    });

    it('should show downward trend when score decreases', () => {
      render(<ScoreIndicator score={65} previousScore={75} />);

      expect(screen.getByTestId('trending-down')).toBeInTheDocument();
      expect(screen.getByText('10.0')).toBeInTheDocument();
    });

    it('should not show trend when scores are equal', () => {
      render(<ScoreIndicator score={75} previousScore={75} />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down')).not.toBeInTheDocument();
      expect(screen.queryByTestId('minus')).not.toBeInTheDocument();
    });

    it('should not show trend when showTrend is false', () => {
      render(<ScoreIndicator score={85} previousScore={75} showTrend={false} />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
    });

    it('should not show trend when no previous score is provided', () => {
      render(<ScoreIndicator score={85} />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down')).not.toBeInTheDocument();
    });

    it('should handle string previous scores', () => {
      render(<ScoreIndicator score={85} previousScore="75.5" />);

      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
      expect(screen.getByText('9.5')).toBeInTheDocument();
    });

    it('should handle invalid previous scores gracefully', () => {
      render(<ScoreIndicator score={85} previousScore="invalid" />);

      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
      expect(screen.getByText('85.0')).toBeInTheDocument(); // 85 - 0 = 85
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<ScoreIndicator score={75} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should combine default and custom classes', () => {
      const { container } = render(<ScoreIndicator score={75} className="custom-class" />);

      expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2', 'custom-class');
    });
  });
});

describe('ScoreProgress', () => {
  describe('Progress Bar Rendering', () => {
    it('should render progress bar with correct score', () => {
      const { container } = render(<ScoreProgress score={75} />);

      const progressBar = container.querySelector('[style*="75%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle string scores', () => {
      const { container } = render(<ScoreProgress score="85.5" />);

      const progressBar = container.querySelector('[style*="85.5%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle invalid scores', () => {
      const { container } = render(<ScoreProgress score="invalid" />);

      const progressBar = container.querySelector('[style*="0%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle null/undefined scores', () => {
      const { container } = render(<ScoreProgress score={null} />);

      const progressBar = container.querySelector('[style*="0%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Progress Bar Colors', () => {
    it('should apply green background for excellent scores', () => {
      const { container } = render(<ScoreProgress score={85} />);

      const progressBar = container.querySelector('div div');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('should apply blue background for good scores', () => {
      const { container } = render(<ScoreProgress score={70} />);

      const progressBar = container.querySelector('div div');
      expect(progressBar).toHaveClass('bg-blue-500');
    });

    it('should apply yellow background for average scores', () => {
      const { container } = render(<ScoreProgress score={50} />);

      const progressBar = container.querySelector('div div');
      expect(progressBar).toHaveClass('bg-yellow-500');
    });

    it('should apply red background for poor scores', () => {
      const { container } = render(<ScoreProgress score={25} />);

      const progressBar = container.querySelector('div div');
      expect(progressBar).toHaveClass('bg-red-500');
    });
  });

  describe('Animation Control', () => {
    it('should be animated by default', () => {
      const { container } = render(<ScoreProgress score={75} />);

      // Le composant devrait être rendu (on ne peut pas tester l'animation initiale facilement)
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should respect animated=false', () => {
      const { container } = render(<ScoreProgress score={75} animated={false} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<ScoreProgress score={75} className="custom-progress" />);

      expect(container.firstChild).toHaveClass('custom-progress');
    });

    it('should maintain base classes with custom className', () => {
      const { container } = render(<ScoreProgress score={75} className="custom-progress" />);

      expect(container.firstChild).toHaveClass('relative', 'h-2', 'bg-muted', 'rounded-full', 'overflow-hidden', 'custom-progress');
    });
  });
});

describe('RankingBadge', () => {
  describe('Badge Rendering', () => {
    it('should render ranking badge with correct number', () => {
      render(<RankingBadge ranking={5} total={100} />);

      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('should render badge component', () => {
      render(<RankingBadge ranking={5} total={100} />);

      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });
  });

  describe('Badge Variants Based on Ranking', () => {
    it('should use default variant for top 10% rankings', () => {
      render(<RankingBadge ranking={5} total={100} />); // 5% - top 10%

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'default');
    });

    it('should use default variant for exactly 10%', () => {
      render(<RankingBadge ranking={10} total={100} />); // 10%

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'default');
    });

    it('should use secondary variant for top 25% rankings', () => {
      render(<RankingBadge ranking={15} total={100} />); // 15% - top 25%

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    it('should use secondary variant for exactly 25%', () => {
      render(<RankingBadge ranking={25} total={100} />); // 25%

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    it('should use outline variant for lower rankings', () => {
      render(<RankingBadge ranking={50} total={100} />); // 50% - lower

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    it('should handle different total values correctly', () => {
      // 2 out of 50 = 4% (top 10%)
      render(<RankingBadge ranking={2} total={50} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'default');
    });

    it('should handle edge case with total of 1', () => {
      render(<RankingBadge ranking={1} total={1} />); // 100%

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Trend Indicators', () => {
    it('should show upward trend icon', () => {
      render(<RankingBadge ranking={5} total={100} trend="up" />);

      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
    });

    it('should show downward trend icon', () => {
      render(<RankingBadge ranking={5} total={100} trend="down" />);

      expect(screen.getByTestId('trending-down')).toBeInTheDocument();
    });

    it('should not show trend icon for stable trend', () => {
      render(<RankingBadge ranking={5} total={100} trend="stable" />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down')).not.toBeInTheDocument();
    });

    it('should not show trend icon when no trend is provided', () => {
      render(<RankingBadge ranking={5} total={100} />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down')).not.toBeInTheDocument();
    });

    it('should apply correct colors to trend icons', () => {
      const { rerender } = render(<RankingBadge ranking={5} total={100} trend="up" />);

      let trendIcon = screen.getByTestId('trending-up');
      expect(trendIcon).toHaveClass('text-green-500');

      rerender(<RankingBadge ranking={5} total={100} trend="down" />);

      trendIcon = screen.getByTestId('trending-down');
      expect(trendIcon).toHaveClass('text-red-500');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <RankingBadge ranking={5} total={100} className="custom-badge" />
      );

      expect(container.firstChild).toHaveClass('custom-badge');
    });

    it('should maintain base classes with custom className', () => {
      const { container } = render(
        <RankingBadge ranking={5} total={100} className="custom-badge" />
      );

      expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-1', 'custom-badge');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero ranking gracefully', () => {
      render(<RankingBadge ranking={0} total={100} />);

      expect(screen.getByText('#0')).toBeInTheDocument();
    });

    it('should handle negative ranking', () => {
      render(<RankingBadge ranking={-1} total={100} />);

      expect(screen.getByText('#-1')).toBeInTheDocument();
    });

    it('should handle zero total', () => {
      render(<RankingBadge ranking={1} total={0} />);

      // Should not crash and display the ranking
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should handle ranking higher than total', () => {
      render(<RankingBadge ranking={150} total={100} />);

      expect(screen.getByText('#150')).toBeInTheDocument();

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'outline'); // 150% > 25%
    });
  });
});

describe('Integration Tests', () => {
  it('should work well together in a typical usage scenario', () => {
    render(
      <div>
        <ScoreIndicator score={87.5} previousScore={82.1} size="lg" />
        <ScoreProgress score={87.5} />
        <RankingBadge ranking={3} total={50} trend="up" />
      </div>
    );

    // ScoreIndicator assertions
    expect(screen.getByText('87.5')).toBeInTheDocument();
    expect(screen.getByText('5.4')).toBeInTheDocument(); // 87.5 - 82.1
    expect(screen.getByTestId('trending-up')).toBeInTheDocument();

    // RankingBadge assertions
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getAllByTestId('trending-up')).toHaveLength(2); // One from ScoreIndicator, one from RankingBadge

    // All components should be present
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('should handle edge cases across all components', () => {
    render(
      <div>
        <ScoreIndicator score={null} previousScore={undefined} showTrend={false} />
        <ScoreProgress score="invalid" animated={false} />
        <RankingBadge ranking={0} total={0} />
      </div>
    );

    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('#0')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });
});