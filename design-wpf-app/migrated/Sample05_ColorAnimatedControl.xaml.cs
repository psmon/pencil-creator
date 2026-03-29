using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;

namespace design_wpf_app.Migrated
{
    public partial class Sample05_ColorAnimatedControl : UserControl
    {
        public Sample05_ColorAnimatedControl()
        {
            InitializeComponent();
        }

        private void PlayStoryboard(string key)
        {
            var sb = (Storyboard)FindResource(key);
            sb.Begin(this);
        }

        private void InnerBorder_MouseEnter(object sender, MouseEventArgs e)
        {
            PlayStoryboard("BorderColorToBlue");
        }

        private void ContentPanel_MouseEnter(object sender, MouseEventArgs e)
        {
            PlayStoryboard("ContentColorToPurple");
        }

        private void ContentPanel_MouseLeave(object sender, MouseEventArgs e)
        {
            PlayStoryboard("ContentColorToWhite");
        }
    }
}
