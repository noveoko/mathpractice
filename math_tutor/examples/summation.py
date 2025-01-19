import manim as m

class Summation(m.Scene):
    def construct(self):
        # Define the variables involved in the summation
        n = 5
        a = 2
        b = 3

        # Create the components of the equation
        sum_eq = m.Tex("\\sum_{i=a}^b {a + i}")
        sum_rect = m.Rectangle(height=1, width=n+1)
        sum_arrows = [m.Arrow(ORIGIN, RIGHT) for _ in range(n)]
        sum_brackets = [m.Brace(sum_rect, UP) for _ in range(2)]

        # Animate the creation of the equation
        self.play(m.Write(sum_eq))
        self.wait()

        # Animate the creation of the sum rectangle and arrows
        self.play(m.Transform(sum_eq, m.Tex("\\sum_{i=a}^b {(a + i)}")))
        self.play(m.Create(sum_rect))
        for arrow in sum_arrows:
            self.play(m.Write(arrow))
            self.wait()

        # Animate the creation of the braces
        self.play(m.Transform(sum_eq, m.Tex("\\sum_{i=a}^b {a + i}")))
        for brace in sum_brackets:
            self.play(m.Write(brace))
            self.wait()

        # Animate the highlighting of the key steps
        self.play(m.Indicate(sum_rect, color=RED))
        self.play(m.Indicate(sum_brackets[0], color=RED))
        self.play(m.Indicate(sum_arrows[0], color=RED))

        # Animate the result of the operation
        self.play(m.Transform(sum_eq, m.Tex("\\sum_{i=a}^b {a + i} = n(n+1)/2")))
        self.wait()
